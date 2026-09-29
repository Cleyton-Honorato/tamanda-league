import Link from 'next/link';
import { ExternalLink, Menu, ShieldCheck } from 'lucide-react';
import { LogoInline } from '@/components/brand/Logo';
import { AdminNav } from '@/components/layout/AdminNav';
import { LogoutButton } from '@/features/admin/components/LogoutButton';
import { requireAdmin } from '@/server/auth/session';
import { ROUTES } from '@/lib/constants';

export default async function AdminLayout({ children }: LayoutProps<'/admin'>) {
  // Autoridade real do controle de acesso — o proxy é só uma checagem otimista.
  const admin = await requireAdmin();

  return (
    <div className="admin-shell min-h-dvh lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-surface lg:flex">
        <Link href={ROUTES.admin} className="flex h-20 shrink-0 items-center border-b border-border px-5">
          <LogoInline />
        </Link>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-7">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Gestão do campeonato</p>
          <AdminNav />
        </div>
        <div className="admin-sidebar-signature border-t border-border p-5">
          <p className="font-display text-xl uppercase tracking-wider text-primary">Basquete. Respeito.</p>
          <p className="font-display text-xl uppercase tracking-wider text-accent">Comunidade.</p>
          <p className="mt-3 text-xs text-muted-foreground">Tamanda League · 3x3</p>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-20 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6 xl:px-8">
        <div className="flex items-center gap-3">
          <details className="group lg:hidden">
            <summary aria-label="Abrir menu administrativo" className="flex cursor-pointer list-none items-center rounded-lg border border-border p-2 text-primary [&::-webkit-details-marker]:hidden">
              <Menu className="h-5 w-5" />
            </summary>
            <div className="absolute inset-x-0 top-20 max-h-[calc(100dvh-5rem)] overflow-y-auto border-b border-border bg-surface p-4 shadow-2xl">
              <AdminNav />
            </div>
          </details>
          <Link href={ROUTES.admin} className="lg:hidden">
            <LogoInline />
          </Link>
          <div className="hidden items-center gap-2 text-sm text-muted-foreground lg:flex">
            <ShieldCheck className="h-4 w-4 text-primary" /> Área administrativa
          </div>
        </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-3">
            <Link
              href={ROUTES.home}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] px-2.5 py-1.5 font-display text-sm uppercase tracking-wider text-muted-foreground hover:bg-elevated hover:text-primary"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">Ver site</span>
            </Link>
            <div className="hidden items-center gap-2 border-l border-border pl-4 sm:flex">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/30 bg-primary/10 font-display text-lg text-primary">{admin.name.slice(0, 1)}</span>
              <span className="text-sm text-foreground">{admin.name}</span>
            </div>
            <LogoutButton />
          </div>
      </header>
      <main className="min-w-0 px-4 py-6 sm:px-6 xl:px-8 xl:py-8">{children}</main>
    </div>
  );
}
