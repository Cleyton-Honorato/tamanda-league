'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Pencil, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ActionError, onSubmitForm, useAction } from './useAction';
import { useCloudinaryUpload } from './useCloudinaryUpload';
import {
  createMediaAction,
  deleteMediaAction,
  updateMediaCaptionAction,
} from '@/server/actions/media';
import { thumbUrl, videoThumbUrl } from '@/lib/cloudinary-url';
import type { MediaDto } from '@/lib/types';

export function GalleryManager({
  items,
  cloudinaryReady,
}: {
  items: MediaDto[];
  cloudinaryReady: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState<MediaDto | null>(null);

  const { upload, uploading, progress, error: uploadError } = useCloudinaryUpload();
  const create = useAction(createMediaAction);
  const remove = useAction(deleteMediaAction);
  const caption = useAction(updateMediaCaptionAction);

  async function handleFiles(files: File[]) {
    const assets = await upload(files);
    for (const asset of assets) {
      create.run({
        publicId: asset.publicId,
        url: asset.url,
        type: asset.type,
        width: asset.width,
        height: asset.height,
        caption: null,
      });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-wide">
            Galeria
          </h1>
          <p className="text-sm text-muted-foreground">
            {items.length} arquivo(s) publicados.
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={async (event) => {
            const files = Array.from(event.target.files ?? []);
            event.target.value = '';
            if (files.length > 0) await handleFiles(files);
          }}
        />

        <Button
          disabled={!cloudinaryReady || uploading}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
          {uploading
            ? progress
              ? `Enviando ${progress.done}/${progress.total}…`
              : 'Enviando…'
            : 'Enviar'}
        </Button>
      </div>

      {!cloudinaryReady && (
        <p className="rounded-[var(--radius-md)] border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-accent">
          Para enviar fotos e vídeos, preencha CLOUDINARY_CLOUD_NAME,
          CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET no arquivo .env.local e
          reinicie o servidor.
        </p>
      )}

      <ActionError message={uploadError ?? create.error ?? remove.error} />

      {items.length === 0 ? (
        <EmptyState
          title="Galeria vazia"
          description="Envie as fotos e vídeos dos jogos."
        />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <li key={item.id}>
              <Card className="overflow-hidden p-0">
                <div className="relative aspect-square">
                  <Image
                    src={
                      item.type === 'video'
                        ? videoThumbUrl(item.url, 400)
                        : thumbUrl(item.url, 400)
                    }
                    alt={item.caption ?? ''}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover"
                  />
                  {item.type === 'video' && (
                    <span className="absolute left-1.5 top-1.5 rounded-sm bg-black/70 px-1.5 py-0.5 font-display text-xs uppercase tracking-wider text-accent">
                      Vídeo
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-2 p-2">
                  <p className="line-clamp-2 min-h-[2.5rem] text-xs text-muted-foreground">
                    {item.caption ?? 'Sem legenda'}
                  </p>

                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setEditing(item)}
                      aria-label="Editar legenda"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={remove.pending}
                      onClick={() => {
                        if (confirm('Excluir este arquivo?')) {
                          remove.run({ id: item.id });
                        }
                      }}
                      aria-label="Excluir"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Legenda"
        size="sm"
      >
        {editing && (
          <form
            onSubmit={onSubmitForm((formData) =>
              caption.run(
                { id: editing.id, caption: formData.get('caption') },
                () => setEditing(null),
              ),
            )}
            className="flex flex-col gap-4"
          >
            <Input
              id="caption"
              name="caption"
              label="Legenda"
              maxLength={160}
              placeholder="Final do campeonato"
              defaultValue={editing.caption ?? ''}
              error={caption.fieldErrors.caption}
            />

            <ActionError message={caption.error} />

            <div className="flex gap-2">
              <Button type="submit" fullWidth disabled={caption.pending}>
                {caption.pending ? 'Salvando…' : 'Salvar'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditing(null)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
