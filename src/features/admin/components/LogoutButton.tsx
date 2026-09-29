'use client';

import { useTransition } from 'react';
import { LogOut } from 'lucide-react';
import { logoutAction } from '@/server/actions/auth';

export function LogoutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-label="Sair do painel"
      onClick={() => startTransition(() => logoutAction())}
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] px-2.5 py-1.5 font-display text-sm uppercase tracking-wider text-muted-foreground transition-colors hover:bg-elevated hover:text-accent disabled:opacity-50"
    >
      <LogOut className="h-4 w-4" />
      <span className="hidden sm:inline">Sair</span>
    </button>
  );
}
