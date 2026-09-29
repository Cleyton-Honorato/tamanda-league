import 'server-only';
import { dbConnect } from '@/server/db';
import { DomainError, NotFoundError } from '@/server/errors';
import { Athlete } from '@/server/models/athlete';

export interface AthleteDto {
  id: string;
  name: string;
  nickname: string | null;
  teamId: string | null;
}

export async function listAthletes(): Promise<AthleteDto[]> {
  await dbConnect();
  const athletes = await Athlete.find().sort({ name: 1 }).lean();
  return athletes.map((athlete) => ({
    id: athlete._id.toString(),
    name: athlete.name,
    nickname: athlete.nickname,
    teamId: athlete.teamId?.toString() ?? null,
  }));
}

export async function saveAthlete(input: { id?: string; name: string; nickname: string | null }) {
  await dbConnect();
  const duplicate = await Athlete.findOne({ name: input.name, _id: { $ne: input.id } })
    .collation({ locale: 'pt', strength: 2 })
    .lean();
  if (duplicate) throw new DomainError('Já existe um atleta com esse nome.', 'name');
  if (!input.id) {
    const athlete = await Athlete.create({ name: input.name, nickname: input.nickname });
    return athlete._id.toString();
  }
  const athlete = await Athlete.findByIdAndUpdate(input.id, { name: input.name, nickname: input.nickname });
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
