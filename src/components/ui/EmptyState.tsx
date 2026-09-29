import type { ReactNode } from 'react';
import { Chevrons } from '@/components/brand/Chevrons';

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-border bg-surface/50 px-6 py-10 text-center">
      <Chevrons className="opacity-60" />
      <p className="font-display text-xl uppercase tracking-wide text-foreground">
        {title}
      </p>
      {description && (
        <p className="max-w-xs text-sm text-muted-foreground">{description}</p>
      )}
      {action}
    </div>
  );
}
