import Link from 'next/link';
import { cn } from '@/lib/cn';

export interface TabItem {
  label: string;
  href: string;
  active: boolean;
}

/**
 * Abas como links — o estado vive na URL, então a página continua sendo um
 * Server Component e a navegação funciona com o botão voltar.
 */
export function Tabs({ items, className }: { items: TabItem[]; className?: string }) {
  return (
    <nav className={cn('no-scrollbar -mx-5 overflow-x-auto px-5', className)}>
      <ul className="flex gap-2">
        {items.map((item) => (
          <li key={item.href} className="shrink-0">
            <Link
              href={item.href}
              aria-current={item.active ? 'page' : undefined}
              className={cn(
                'block rounded-[var(--radius-md)] border px-3.5 py-2',
                'font-display text-base uppercase tracking-wider whitespace-nowrap transition-colors',
                item.active
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-accent/50 hover:text-foreground',
              )}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
