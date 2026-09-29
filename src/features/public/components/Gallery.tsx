'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Play, X } from 'lucide-react';
import { imageUrl, thumbUrl, videoThumbUrl } from '@/lib/cloudinary-url';
import { cn } from '@/lib/cn';
import type { MediaDto } from '@/lib/types';

function Lightbox({
  items,
  index,
  onClose,
  onNavigate,
}: {
  items: MediaDto[];
  index: number;
  onClose: () => void;
  onNavigate: (next: number) => void;
}) {
  const item = items[index];

  const go = useCallback(
    (delta: number) => {
      // Circular: do último volta para o primeiro.
      onNavigate((index + delta + items.length) % items.length);
    },
    [index, items.length, onNavigate],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') go(1);
      if (event.key === 'ArrowLeft') go(-1);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [go, onClose]);

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-label={item.caption ?? 'Mídia da galeria'}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <span className="font-display text-sm uppercase tracking-widest text-muted-foreground">
          {index + 1} / {items.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="rounded-full p-2 text-foreground hover:bg-white/10"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div
        className="relative flex flex-1 items-center justify-center px-2"
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        {item.type === 'video' ? (
          <video
            key={item.id}
            src={item.url}
            controls
            autoPlay
            playsInline
            className="max-h-full max-w-full rounded-[var(--radius-md)]"
          />
        ) : (
          <Image
            key={item.id}
            src={imageUrl(item.url, 1600)}
            alt={item.caption ?? ''}
            width={item.width ?? 1600}
            height={item.height ?? 1200}
            className="max-h-[70dvh] w-auto object-contain"
          />
        )}

        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Anterior"
              className="absolute left-2 rounded-full bg-black/60 p-2.5 text-foreground hover:bg-black/80"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Próxima"
              className="absolute right-2 rounded-full bg-black/60 p-2.5 text-foreground hover:bg-black/80"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      {item.caption && (
        <p className="px-5 py-4 text-center text-sm text-muted-foreground">
          {item.caption}
        </p>
      )}
    </div>
  );
}

export function Gallery({ items }: { items: MediaDto[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item, index) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              className={cn(
                'group relative block aspect-square w-full overflow-hidden',
                'rounded-[var(--radius-md)] border border-border',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
              )}
            >
              <Image
                src={
                  item.type === 'video'
                    ? videoThumbUrl(item.url, 500)
                    : thumbUrl(item.url, 500)
                }
                alt={item.caption ?? ''}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-transform group-hover:scale-105"
              />

              {item.type === 'video' && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/90">
                    <Play className="h-5 w-5 fill-background text-background" />
                  </span>
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      {openIndex !== null && (
        <Lightbox
          items={items}
          index={openIndex}
          onClose={() => setOpenIndex(null)}
          onNavigate={setOpenIndex}
        />
      )}
    </>
  );
}
