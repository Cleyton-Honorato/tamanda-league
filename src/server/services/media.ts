import 'server-only';
import { dbConnect } from '@/server/db';
import { NotFoundError } from '@/server/errors';
import { Media } from '@/server/models/media';
import { toMediaDto } from '@/server/serialization';
import { destroyAsset } from '@/server/services/cloudinary';
import type { MediaDto, MediaType } from '@/lib/types';

export async function listMedia(limit?: number): Promise<MediaDto[]> {
  await dbConnect();
  const query = Media.find().sort({ createdAt: -1 });
  if (limit) query.limit(limit);
  const items = await query.lean();
  return items.map(toMediaDto);
}

export async function countMedia(): Promise<number> {
  await dbConnect();
  return Media.countDocuments();
}

export interface MediaInput {
  publicId: string;
  url: string;
  type: MediaType;
  caption: string | null;
  width: number | null;
  height: number | null;
}

export async function createMedia(input: MediaInput): Promise<MediaDto> {
  await dbConnect();
  const media = await Media.create(input);
  return toMediaDto(media);
}

export async function updateMediaCaption(
  id: string,
  caption: string | null,
): Promise<MediaDto> {
  await dbConnect();
  const media = await Media.findByIdAndUpdate(
    id,
    { caption },
    { returnDocument: 'after' },
  ).lean();
  if (!media) throw new NotFoundError('Mídia não encontrada.');
  return toMediaDto(media);
}

export async function deleteMedia(id: string): Promise<void> {
  await dbConnect();

  const media = await Media.findByIdAndDelete(id);
  if (!media) throw new NotFoundError('Mídia não encontrada.');

  // O registro já saiu do banco; se a remoção no Cloudinary falhar, resta um
  // arquivo órfão lá — preferível a deixar a galeria apontando para o vazio.
  await destroyAsset(media.publicId, media.type).catch((error) => {
    console.error('[media] falha ao remover do Cloudinary:', error);
  });
}
