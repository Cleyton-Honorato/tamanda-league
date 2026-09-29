'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarDays,
  Images,
  LayoutDashboard,
  Layers,
  Trophy,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/cn';

const ITEMS = [
  { href: '/admin', label: 'Painel', icon: LayoutDashboard },
  { href: '/admin/atletas', label: 'Atletas', icon: Users },
  { href: '/admin/times', label: 'Times', icon: Users },
  { href: '/admin/grupos', label: 'Conferências', icon: Layers },
  { href: '/admin/jogos', label: 'Jogos', icon: CalendarDays },
  { href: '/admin/chaveamento', label: 'Mata-mata', icon: Trophy },
  { href: '/admin/galeria', label: 'Galeria', icon: Images },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Menu administrativo">
      <ul className="flex flex-col gap-1.5">
        {ITEMS.map((item) => {
          const active =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                onClick={(event) => event.currentTarget.closest('details')?.removeAttribute('open')}
                className={cn(
                  'relative flex items-center gap-3 rounded-[var(--radius-md)] border px-3 py-3',
                  'font-display text-base uppercase tracking-wider whitespace-nowrap transition-colors',
                  active
                    ? 'border-primary/25 bg-primary/10 text-primary shadow-[inset_3px_0_0_var(--green)]'
                    : 'border-transparent text-muted-foreground hover:bg-elevated hover:text-foreground',
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
