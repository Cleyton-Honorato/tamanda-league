'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Trophy } from 'lucide-react';
import { cn } from '@/lib/cn';
import { ROUTES } from '@/lib/constants';

const ITEMS = [
  { href: ROUTES.home, label: 'Início', icon: Home },
  { href: ROUTES.campeonato, label: 'Campeonato', icon: Trophy },
];

/**
 * Navegação principal. No celular vira barra fixa no rodapé — o alcance do
 * polegar; a partir de `lg` sobe para o cabeçalho.
 */
export function BottomNav({ variant }: { variant: 'bar' | 'inline' }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === ROUTES.home ? pathname === href : pathname.startsWith(href);

  if (variant === 'inline') {
    return (
      <nav className="hidden lg:block">
        <ul className="flex items-center gap-1">
          {ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive(item.href) ? 'page' : undefined}
                className={cn(
                  'rounded-[var(--radius-md)] px-3 py-2 font-display text-base uppercase tracking-wider transition-colors',
                  isActive(item.href)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-elevated hover:text-foreground',
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

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <ul className="mx-auto flex max-w-lg items-stretch">
        {ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-16 flex-col items-center justify-center gap-1 px-1 transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <Icon className={cn('h-5 w-5', active && 'drop-shadow-[0_0_6px_rgba(22,201,86,0.6)]')} />
                <span className="font-display text-[11px] uppercase tracking-wider leading-none">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
