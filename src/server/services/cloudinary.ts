import 'server-only';
import { v2 as cloudinary } from 'cloudinary';
import { CLOUDINARY_FOLDER } from '@/lib/constants';
import { DomainError } from '@/server/errors';
import type { MediaType } from '@/lib/types';

function config() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  return { cloudName, apiKey, apiSecret };
}

export function isCloudinaryConfigured(): boolean {
  const { cloudName, apiKey, apiSecret } = config();
  return Boolean(cloudName && apiKey && apiSecret);
}

export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
}

/**
 * Credencial de upload de uso único. O navegador envia o arquivo direto para o
 * Cloudinary com esta assinatura — o `api_secret` fica só aqui no servidor e o
 * arquivo não passa pelo nosso processo.
 */
export function getUploadSignature(subfolder?: string): UploadSignature {
  const { cloudName, apiKey, apiSecret } = config();
  if (!cloudName || !apiKey || !apiSecret) {
    throw new DomainError(
      'Cloudinary não configurado. Preencha as credenciais em .env.local.',
    );
  }

  const folder = subfolder
    ? `${CLOUDINARY_FOLDER}/${subfolder}`
    : CLOUDINARY_FOLDER;
  const timestamp = Math.round(Date.now() / 1000);

  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    apiSecret,
  );

  return { cloudName, apiKey, timestamp, folder, signature };
}

/** Remove o arquivo do Cloudinary. Vídeo e imagem têm `resource_type` distinto. */
export async function destroyAsset(
  publicId: string,
  type: MediaType,
): Promise<void> {
  const { cloudName, apiKey, apiSecret } = config();
  if (!cloudName || !apiKey || !apiSecret) return;

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  await cloudinary.uploader.destroy(publicId, { resource_type: type });
}
