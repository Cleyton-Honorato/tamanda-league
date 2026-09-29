'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Fecha no Esc e trava a rolagem do fundo enquanto está aberto — sem isso, no
 * celular o dedo arrasta a página atrás do modal.
 */
function useModalBehavior(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);
}

export function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  const mounted = useRef(false);
  useModalBehavior(open, onClose);

  useEffect(() => {
    mounted.current = true;
  }, []);

  if (!open || typeof document === 'undefined') return null;

  const maxWidth = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl' }[size];

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          'w-full rounded-t-[var(--radius-lg)] border border-border bg-surface',
          'max-h-[92dvh] overflow-y-auto sm:rounded-[var(--radius-lg)]',
          maxWidth,
        )}
      >
        <div className="sticky top-0 flex items-center justify-between gap-3 border-b border-border bg-surface px-5 py-3">
          <h2 className="font-display text-xl uppercase tracking-wide">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-[var(--radius-sm)] p-1.5 text-muted-foreground hover:bg-elevated hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
