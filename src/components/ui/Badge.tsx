import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'green' | 'orange' | 'neutral' | 'live';

const TONES: Record<Tone, string> = {
  green: 'border-primary/40 bg-primary/10 text-primary',
  orange: 'border-accent/40 bg-accent/10 text-accent',
  neutral: 'border-border bg-elevated text-muted-foreground',
  live: 'border-accent bg-accent text-background',
};

export function Badge({
  tone = 'neutral',
  icon,
  children,
  className,
}: {
  tone?: Tone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border px-2.5 py-1',
        'font-display text-sm uppercase tracking-wider leading-none',
        TONES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
