import 'server-only';
import { dbConnect } from '@/server/db';
import { DomainError, NotFoundError } from '@/server/errors';
import { Group } from '@/server/models/group';
import { Match } from '@/server/models/match';
import { Team } from '@/server/models/team';
import { toGroupDto } from '@/server/serialization';
import type { GroupDto } from '@/lib/types';

export async function listGroups(): Promise<GroupDto[]> {
  await dbConnect();
  const groups = await Group.find().sort({ order: 1, name: 1 }).lean();
  return groups.map(toGroupDto);
}

export async function createGroup(input: {
  name: string;
  order: number;
}): Promise<GroupDto> {
  await dbConnect();

  if (await Group.countDocuments() >= 2) {
    throw new DomainError('O campeonato usa duas conferências. Edite uma delas para mudar o nome.');
  }

  const existing = await Group.findOne({ name: input.name }).lean();
  if (existing) {
    throw new DomainError('Já existe um grupo com esse nome.', 'name');
  }

  const group = await Group.create(input);
  return toGroupDto(group);
}

export async function updateGroup(
  id: string,
  input: { name: string; order: number },
): Promise<GroupDto> {
  await dbConnect();

  const duplicate = await Group.findOne({ name: input.name, _id: { $ne: id } }).lean();
  if (duplicate) {
    throw new DomainError('Já existe um grupo com esse nome.', 'name');
  }

  const group = await Group.findByIdAndUpdate(id, input, { returnDocument: 'after' }).lean();
  if (!group) throw new NotFoundError('Grupo não encontrado.');

  return toGroupDto(group);
}

export async function deleteGroup(id: string): Promise<void> {
  await dbConnect();

  const [teams, matches] = await Promise.all([
    Team.countDocuments({ groupId: id }),
    Match.countDocuments({ groupId: id }),
  ]);

  if (teams > 0) {
    throw new DomainError(
      'Esse grupo ainda tem times. Mova os times antes de excluir.',
    );
  }
  if (matches > 0) {
    throw new DomainError(
      'Esse grupo ainda tem jogos. Exclua os jogos antes de excluir o grupo.',
    );
  }

  const deleted = await Group.findByIdAndDelete(id);
  if (!deleted) throw new NotFoundError('Grupo não encontrado.');
}
