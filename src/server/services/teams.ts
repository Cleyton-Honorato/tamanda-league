import 'server-only';
import { dbConnect } from '@/server/db';
import { DomainError, NotFoundError } from '@/server/errors';
import { Match } from '@/server/models/match';
import { Team } from '@/server/models/team';
import { Athlete } from '@/server/models/athlete';
import { toTeamDto, toTeamRefDto } from '@/server/serialization';
import type { TeamDto, TeamRefDto } from '@/lib/types';
import { destroyAsset } from '@/server/services/cloudinary';
import { databaseSupportsTransactions } from '@/server/db-capabilities';
import { Types, type ClientSession } from 'mongoose';

export async function listTeams(): Promise<TeamDto[]> {
  await dbConnect();
  const teams = await Team.find().sort({ name: 1 }).lean();
  return teams.map(toTeamDto);
}

export async function listTeamsByGroup(groupId: string): Promise<TeamDto[]> {
  await dbConnect();
  const teams = await Team.find({ groupId }).sort({ name: 1 }).lean();
  return teams.map(toTeamDto);
}

/** Índice usado para montar os jogos sem uma consulta por time. */
export async function getTeamsIndex(): Promise<Map<string, TeamRefDto>> {
  await dbConnect();
  const teams = await Team.find().lean();
  return new Map(teams.map((team) => [team._id.toString(), toTeamRefDto(team)]));
}

export interface TeamInput {
  name: string;
  shortName: string;
  groupId: string | null;
  crestPublicId: string | null;
  crestUrl: string | null;
}

export async function createTeam(input: TeamInput): Promise<TeamDto> {
  await dbConnect();

  const existing = await Team.findOne({ name: input.name }).lean();
  if (existing) {
    throw new DomainError('Já existe um time com esse nome.', 'name');
  }

  const team = await Team.create(input);
  return toTeamDto(team);
}

export async function updateTeam(
  id: string,
  input: TeamInput,
): Promise<TeamDto> {
  await dbConnect();

  const duplicate = await Team.findOne({ name: input.name, _id: { $ne: id } }).lean();
  if (duplicate) {
    throw new DomainError('Já existe um time com esse nome.', 'name');
  }

  const current = await Team.findById(id).lean();
  if (!current) throw new NotFoundError('Time não encontrado.');

  if (current.groupId?.toString() !== input.groupId) {
    const groupGames = await Match.countDocuments({ stage: 'GROUP', $or: [{ teamAId: id }, { teamBId: id }] });
    if (groupGames > 0) {
      throw new DomainError('Este time já tem jogos na fase de grupos. Ajuste os jogos antes de mudar sua conferência.', 'groupId');
    }
  }

  const team = await Team.findByIdAndUpdate(id, input, { returnDocument: 'after' }).lean();
  if (!team) throw new NotFoundError('Time não encontrado.');

  // Escudo trocado: o arquivo antigo não serve mais a ninguém.
  if (
    current.crestPublicId &&
    current.crestPublicId !== input.crestPublicId
  ) {
    await destroyAsset(current.crestPublicId, 'image').catch(() => undefined);
  }

  return toTeamDto(team);
}

/** Move um atleta para uma vaga livre ou troca sua posição com outro atleta. */
export async function transferAthlete(athleteId: string, destinationTeamId: string | null, swapAthleteId: string | null): Promise<void> {
  const db = await dbConnect();
  const run = async (session?: ClientSession) => {
    const source = await Athlete.findById(athleteId).session(session ?? null).lean();
    if (!source) throw new NotFoundError('Atleta não encontrado.');
    const sourceTeamId = source.teamId?.toString() ?? null;
    if (sourceTeamId === destinationTeamId) throw new DomainError('Escolha outro time para o atleta.');
    if (destinationTeamId && !await Team.exists({ _id: destinationTeamId }).session(session ?? null)) throw new NotFoundError('Time de destino não encontrado.');
    const destinationRoster = destinationTeamId ? await Athlete.find({ teamId: destinationTeamId }).session(session ?? null).lean() : [];
    const replacement = swapAthleteId ? destinationRoster.find((athlete) => athlete._id.toString() === swapAthleteId) : null;
    if (swapAthleteId && !replacement) throw new DomainError('O atleta escolhido para a troca não está no time de destino.');
    if (!replacement && destinationRoster.length >= 4) throw new DomainError('O time de destino está completo. Escolha um atleta para trocar.');
    const affected = [sourceTeamId, destinationTeamId].filter((id): id is string => Boolean(id));
    if (affected.length && await Match.exists({ $or: [{ teamAId: { $in: affected } }, { teamBId: { $in: affected } }] }).session(session ?? null)) {
      throw new DomainError('Não é possível alterar o elenco de um time que já tem jogos.');
    }
    const updated = await Athlete.updateOne({ _id: athleteId, teamId: source.teamId ?? null }, { $set: { teamId: destinationTeamId ? new Types.ObjectId(destinationTeamId) : null } }, { session });
    if (updated.modifiedCount !== 1) throw new DomainError('O elenco mudou. Atualize a página e tente novamente.');
    if (replacement) {
      try {
        const swapped = await Athlete.updateOne({ _id: replacement._id, teamId: destinationTeamId }, { $set: { teamId: source.teamId ?? null } }, { session });
        if (swapped.modifiedCount !== 1) throw new DomainError('O elenco mudou. Atualize a página e tente novamente.');
      } catch (error) {
        if (!session) await Athlete.updateOne({ _id: athleteId, teamId: destinationTeamId }, { $set: { teamId: source.teamId ?? null } });
        throw error;
      }
    }
  };
  if (await databaseSupportsTransactions()) {
    const session = await db.startSession();
    try { await session.withTransaction(() => run(session)); }
    finally { await session.endSession(); }
  } else {
    await run();
  }
}

export async function deleteTeam(id: string): Promise<void> {
  const db = await dbConnect();

  const matches = await Match.countDocuments({
    $or: [{ teamAId: id }, { teamBId: id }],
  });
  if (matches > 0) {
    throw new DomainError(
      'Esse time já está em jogos do campeonato. Exclua os jogos antes.',
    );
  }

  const session = await db.startSession();
  let crestPublicId: string | null = null;
  try {
    await session.withTransaction(async () => {
      const team = await Team.findByIdAndDelete(id).session(session);
      if (!team) throw new NotFoundError('Time não encontrado.');
      crestPublicId = team.crestPublicId;
      await Athlete.updateMany({ teamId: id }, { $set: { teamId: null } }).session(session);
    });
  } finally {
    await session.endSession();
  }

  if (crestPublicId) {
    await destroyAsset(crestPublicId, 'image').catch(() => undefined);
  }
}
