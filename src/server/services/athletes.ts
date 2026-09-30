import 'server-only';
import { dbConnect } from '@/server/db';
import { DomainError, NotFoundError } from '@/server/errors';
import { Athlete } from '@/server/models/athlete';
import { Team } from '@/server/models/team';
import { Match } from '@/server/models/match';

export interface AthleteDto {
  id: string;
  name: string;
  nickname: string | null;
  level: number | null;
  teamId: string | null;
}

export async function listAthletes(): Promise<AthleteDto[]> {
  await dbConnect();
  const athletes = await Athlete.find().sort({ name: 1 }).lean();
  return athletes.map((athlete) => ({
    id: athlete._id.toString(),
    name: athlete.name,
    nickname: athlete.nickname,
    level: athlete.level ?? null,
    teamId: athlete.teamId?.toString() ?? null,
  }));
}

export async function saveAthlete(input: { id?: string; name: string; nickname: string | null; level: number | null; teamId: string | null }) {
  await dbConnect();
  const current = input.id ? await Athlete.findById(input.id).lean() : null;
  if (input.id && !current) throw new NotFoundError('Atleta não encontrado.');
  const duplicate = await Athlete.findOne({ name: input.name, _id: { $ne: input.id } })
    .collation({ locale: 'pt', strength: 2 })
    .lean();
  if (duplicate) throw new DomainError('Já existe um atleta com esse nome.', 'name');
  const currentTeamId = current?.teamId?.toString() ?? null;
  if (input.teamId !== currentTeamId) {
    if (input.teamId) {
      if (!await Team.exists({ _id: input.teamId })) throw new DomainError('Time não encontrado.', 'teamId');
      const rosterSize = await Athlete.countDocuments({ teamId: input.teamId, _id: { $ne: input.id } });
      if (rosterSize >= 4) throw new DomainError('Esse time já tem quatro atletas.', 'teamId');
    }
    const affected = [currentTeamId, input.teamId].filter((id): id is string => Boolean(id));
    if (affected.length > 0 && await Match.exists({ $or: [{ teamAId: { $in: affected } }, { teamBId: { $in: affected } }] })) {
      throw new DomainError('Não é possível mudar o elenco de um time que já tem jogos.');
    }
  }
  if (!input.id) {
    const athlete = await Athlete.create({ name: input.name, nickname: input.nickname, level: input.level, teamId: input.teamId });
    return athlete._id.toString();
  }
  const athlete = await Athlete.findByIdAndUpdate(input.id, { name: input.name, nickname: input.nickname, level: input.level, teamId: input.teamId }, { runValidators: true });
  if (!athlete) throw new NotFoundError('Atleta não encontrado.');
  return athlete._id.toString();
}

export async function deleteAthlete(id: string) {
  await dbConnect();
  const athlete = await Athlete.findById(id).lean();
  if (!athlete) throw new NotFoundError('Atleta não encontrado.');
  if (athlete.teamId) throw new DomainError('Remova o atleta do time antes de excluir.');
  await Athlete.findByIdAndDelete(id);
}

export async function setAthleteLevel(id: string, level: number) {
  await dbConnect();
  const athlete = await Athlete.findByIdAndUpdate(id, { level }, { runValidators: true });
  if (!athlete) throw new NotFoundError('Atleta não encontrado.');
}
