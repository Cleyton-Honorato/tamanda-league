'use server';

import { adminAction } from '@/server/actions/_helpers';
import {
  createMediaSchema,
  mediaCaptionSchema,
  mediaIdSchema,
  uploadSignatureSchema,
} from '@/features/admin/schemas';
import {
  createMedia,
  deleteMedia,
  updateMediaCaption,
} from '@/server/services/media';
import { getUploadSignature } from '@/server/services/cloudinary';

const REVALIDATE = ['/', '/galeria', '/admin/galeria'];

/**
 * Credencial para o navegador enviar o arquivo direto ao Cloudinary. Só o
 * `api_key` (público) sai daqui — o segredo fica no servidor.
 */
export async function getUploadSignatureAction(input: unknown) {
  return adminAction({
    schema: uploadSignatureSchema,
    input,
    handler: async (data) => getUploadSignature(data.subfolder),
  });
}

export async function createMediaAction(input: unknown) {
  return adminAction({
    schema: createMediaSchema,
    input,
    revalidate: REVALIDATE,
    handler: async (data) => createMedia(data),
  });
}

export async function updateMediaCaptionAction(input: unknown) {
  return adminAction({
    schema: mediaCaptionSchema,
    input,
    revalidate: REVALIDATE,
    handler: async (data) => updateMediaCaption(data.id, data.caption),
  });
}

export async function deleteMediaAction(input: unknown) {
  return adminAction({
    schema: mediaIdSchema,
    input,
    revalidate: REVALIDATE,
    handler: async (data) => deleteMedia(data.id),
  });
}
