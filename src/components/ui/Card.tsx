import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type Accent = 'green' | 'orange' | 'none';

const ACCENT_BORDER: Record<Accent, string> = {
  green: 'border-l-4 border-l-primary',
  orange: 'border-l-4 border-l-accent',
  none: '',
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  accent?: Accent;
}

export function Card({ accent = 'none', className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)] border border-border bg-surface',
        ACCENT_BORDER[accent],
        className,
      )}
      {...props}
    />
  );
}

/** Alterna verde e laranja ao longo de uma lista, como nas artes. */
export function accentForIndex(index: number): Accent {
  return index % 2 === 0 ? 'green' : 'orange';
}
