'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Expand, Play, X } from 'lucide-react';
import { AnimatePresence, motion, MotionConfig, useReducedMotion } from 'motion/react';
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
  const reducedMotion = useReducedMotion();

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
    <motion.div
      className="fixed inset-0 z-[60] flex flex-col bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-label={item.caption ?? 'Mídia da galeria'}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.25 }}
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
        <AnimatePresence mode="wait">
          <motion.div
            key={item.id}
            className="flex max-h-full items-center justify-center"
            initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: reducedMotion ? 1 : 1.03 }}
            transition={{ duration: reducedMotion ? 0 : 0.28, ease: 'easeOut' }}
          >
            {item.type === 'video' ? (
              <video
                src={item.url}
                controls
                autoPlay
                playsInline
                className="max-h-[70dvh] max-w-full rounded-[var(--radius-md)]"
              />
            ) : (
              <Image
                src={imageUrl(item.url, 1600)}
                alt={item.caption ?? ''}
                width={item.width ?? 1600}
                height={item.height ?? 1200}
                className="max-h-[70dvh] w-auto object-contain"
              />
            )}
          </motion.div>
        </AnimatePresence>

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
    </motion.div>
  );
}

export function Gallery({ items }: { items: MediaDto[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const reducedMotion = useReducedMotion();

  return (
    <MotionConfig reducedMotion="user">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item, index) => (
          <motion.li
            key={item.id}
            initial={{ opacity: 0, y: reducedMotion ? 0 : 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.12 }}
            transition={{ duration: reducedMotion ? 0 : 0.55, delay: reducedMotion ? 0 : Math.min(index, 7) * 0.07, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              aria-label={`Abrir ${item.type === 'video' ? 'vídeo' : 'foto'} ${index + 1}${item.caption ? `: ${item.caption}` : ''}`}
              className={cn(
                'group relative block aspect-square w-full cursor-pointer overflow-hidden',
                'border border-border bg-surface',
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
                className="object-cover"
              />

              <span aria-hidden className="absolute left-0 top-0 h-10 w-10 border-l-2 border-t-2 border-primary-muted" />
              <span aria-hidden className="absolute right-0 top-0 h-10 w-10 border-r-2 border-t-2 border-accent-muted" />
              <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-3 pb-3 pt-10 text-left">
                <span className="min-w-0 truncate font-display text-sm uppercase tracking-wide text-white sm:text-base">{item.caption || (item.type === 'video' ? 'Vídeo da quadra' : 'Foto da quadra')}</span>
                {item.type === 'video' ? <Play className="h-5 w-5 shrink-0 fill-accent text-accent" aria-hidden /> : <Expand className="h-4 w-4 shrink-0 text-primary" aria-hidden />}
              </span>
            </button>
          </motion.li>
        ))}
      </ul>

      <AnimatePresence>
        {openIndex !== null && (
          <Lightbox
            key="gallery-lightbox"
            items={items}
            index={openIndex}
            onClose={() => setOpenIndex(null)}
            onNavigate={setOpenIndex}
          />
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
