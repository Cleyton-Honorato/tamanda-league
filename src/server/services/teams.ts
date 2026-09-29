import 'server-only';
import { dbConnect } from '@/server/db';
import { DomainError, NotFoundError } from '@/server/errors';
import { Match } from '@/server/models/match';
import { Team } from '@/server/models/team';
import { toTeamDto, toTeamRefDto } from '@/server/serialization';
import type { TeamDto, TeamRefDto } from '@/lib/types';
import { destroyAsset } from '@/server/services/cloudinary';

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

export async function deleteTeam(id: string): Promise<void> {
  await dbConnect();

  const matches = await Match.countDocuments({
    $or: [{ teamAId: id }, { teamBId: id }],
  });
  if (matches > 0) {
    throw new DomainError(
      'Esse time já está em jogos do campeonato. Exclua os jogos antes.',
    );
  }

  const team = await Team.findByIdAndDelete(id);
  if (!team) throw new NotFoundError('Time não encontrado.');

  if (team.crestPublicId) {
    await destroyAsset(team.crestPublicId, 'image').catch(() => undefined);
  }
}
