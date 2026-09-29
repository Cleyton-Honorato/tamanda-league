import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CourtLines } from '@/components/brand/CourtLines';
import { LogoMark } from '@/components/brand/Logo';
import { LoginForm } from '@/features/admin/components/LoginForm';
import { ROUTES } from '@/lib/constants';

export const metadata = { title: 'Entrar no painel' };

export default async function AdminLoginPage({ searchParams }: PageProps<'/admin/login'>) {
  const { returnTo } = await searchParams;
  const target = typeof returnTo === 'string' ? returnTo : undefined;

  return (
    <main className="bg-court-glow relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5 py-10">
      <CourtLines className="absolute -bottom-24 left-1/2 w-[52rem] max-w-none -translate-x-1/2 text-foreground/[0.05]" />

      <div className="relative w-full max-w-sm">
        <div className="mb-7 flex flex-col items-center gap-3 text-center">
          <LogoMark size={92} className="shadow-2xl shadow-black/60" />
          <div>
            <p className="font-display text-2xl uppercase leading-none">
              <span className="text-primary">Tamanda</span>{' '}
              <span className="text-accent">League</span>{' '}
              <span className="text-foreground">3X3</span>
            </p>
            <p className="mt-1.5 font-display text-sm uppercase tracking-[0.35em] text-muted-foreground">
              Painel do campeonato
            </p>
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-border bg-surface/90 p-6 shadow-2xl shadow-black/50 backdrop-blur">
          <LoginForm returnTo={target} />
        </div>

        <Link
          href={ROUTES.home}
          className="mt-6 flex items-center justify-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para o site
        </Link>
      </div>
    </main>
  );
}
