'use client';

import { useCallback, useState } from 'react';
import { getUploadSignatureAction } from '@/server/actions/media';
import { MAX_IMAGE_BYTES, MAX_VIDEO_BYTES } from '@/lib/constants';
import type { MediaType } from '@/lib/types';

export interface UploadedAsset {
  publicId: string;
  url: string;
  type: MediaType;
  width: number | null;
  height: number | null;
}

interface CloudinaryResponse {
  public_id: string;
  secure_url: string;
  resource_type: string;
  width?: number;
  height?: number;
}

function validate(file: File): string | null {
  const isVideo = file.type.startsWith('video/');
  const isImage = file.type.startsWith('image/');

  if (!isVideo && !isImage) {
    return `"${file.name}" não é imagem nem vídeo.`;
  }

  const limit = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > limit) {
    const mb = Math.round(limit / (1024 * 1024));
    return `"${file.name}" passa do limite de ${mb} MB.`;
  }

  return null;
}

/**
 * Envia o arquivo direto do navegador para o Cloudinary, usando uma assinatura
 * gerada no servidor. O arquivo não passa pelo nosso processo e a chave secreta
 * nunca chega ao client.
 */
export function useCloudinaryUpload(subfolder?: string) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (files: File[]): Promise<UploadedAsset[]> => {
      setError(null);
      if (files.length === 0) return [];

      for (const file of files) {
        const problem = validate(file);
        if (problem) {
          setError(problem);
          return [];
        }
      }

      setUploading(true);
      setProgress({ done: 0, total: files.length });

      try {
        const signatureResult = await getUploadSignatureAction({ subfolder });
        if (!signatureResult.ok) {
          setError(signatureResult.error);
          return [];
        }

        const { cloudName, apiKey, timestamp, folder, signature } =
          signatureResult.data;

        const uploaded: UploadedAsset[] = [];

        // Sequencial de propósito: numa conexão móvel, vários uploads paralelos
        // disputam a banda e falham mais.
        for (const [index, file] of files.entries()) {
          const body = new FormData();
          body.append('file', file);
          body.append('api_key', apiKey);
          body.append('timestamp', String(timestamp));
          body.append('folder', folder);
          body.append('signature', signature);

          const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
            { method: 'POST', body },
          );

          if (!response.ok) {
            const detail = await response.text();
            console.error('[cloudinary] upload falhou:', detail);
            setError(`Falha ao enviar "${file.name}".`);
            break;
          }

          const data = (await response.json()) as CloudinaryResponse;
          uploaded.push({
            publicId: data.public_id,
            url: data.secure_url,
            type: data.resource_type === 'video' ? 'video' : 'image',
            width: data.width ?? null,
            height: data.height ?? null,
          });

          setProgress({ done: index + 1, total: files.length });
        }

        return uploaded;
      } catch (cause) {
        console.error('[cloudinary] erro inesperado:', cause);
        setError('Não foi possível enviar os arquivos. Tente novamente.');
        return [];
      } finally {
        setUploading(false);
        setProgress(null);
      }
    },
    [subfolder],
  );

  return { upload, uploading, progress, error, setError };
}
