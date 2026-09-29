import type { ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import { Chevrons } from './Chevrons';

/** Título de seção no padrão das artes: `»» TÍTULO`. */
export function SectionTitle({
  children,
  action,
  className,
}: {
  children: ReactNode;
  action?: { label: string; href: string };
  className?: string;
}) {
  return (
    <div className={cn('mb-3 flex items-center justify-between gap-3', className)}>
      <h2 className="flex items-center gap-2 font-display text-2xl uppercase tracking-wide">
        <Chevrons />
        <span>{children}</span>
      </h2>

      {action && (
        <Link
          href={action.href}
          className="shrink-0 font-display text-sm uppercase tracking-widest text-primary hover:text-accent"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
