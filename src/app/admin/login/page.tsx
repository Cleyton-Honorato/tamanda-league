import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { LoginForm } from '@/features/admin/components/LoginForm';
import { LoginMotion } from '@/features/admin/components/LoginMotion';
import { ROUTES } from '@/lib/constants';

export const metadata = { title: 'Entrar no painel' };

export default async function AdminLoginPage({ searchParams }: PageProps<'/admin/login'>) {
  const { returnTo } = await searchParams;
  const target = typeof returnTo === 'string' ? returnTo : undefined;

  return (
    <LoginMotion>
      <div data-login-background aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <Image src="/brand/background_login.png" alt="" fill priority sizes="100vw" className="object-cover" />
        <div className="login-backdrop-overlay absolute inset-0" />
      </div>
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-end px-5 py-5 sm:relative sm:px-10 sm:py-6 lg:px-14">
        <Link href={ROUTES.home} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-background/65 px-3 text-sm text-foreground/90 focus-visible:outline-2 focus-visible:outline-primary sm:min-h-0 sm:bg-transparent sm:px-0">
          <ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline">Voltar para o site</span><span className="sm:hidden">Voltar</span>
        </Link>
      </header>

      <div className="relative mx-auto flex w-full max-w-[1500px] flex-1 flex-col sm:grid sm:content-start sm:gap-6 sm:px-10 sm:pb-8 lg:content-center lg:items-center lg:gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(380px,.8fr)] lg:px-14 lg:py-10">
        <div className="login-visual relative h-[clamp(240px,38svh,340px)] shrink-0 overflow-hidden sm:h-[340px] lg:h-auto lg:min-h-[650px] lg:overflow-visible" aria-hidden="true">
          <div data-login-aura className="login-aura pointer-events-none absolute inset-0" />
          <div data-login-player className="login-player pointer-events-none absolute">
            <Image src="/brand/player.png" alt="" fill priority sizes="(min-width: 1024px) 55vw, (min-width: 640px) 75vw, 100vw" className="object-contain object-bottom" />
          </div>
        </div>

        <section data-login-card className="login-card relative z-10 -mt-5 flex w-full flex-1 flex-col justify-center rounded-t-[30px] border-0 border-t border-primary/30 bg-[#0b1410] px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-8 shadow-[0_-20px_65px_#0008] sm:mx-auto sm:mt-0 sm:block sm:max-w-[470px] sm:flex-none sm:rounded-3xl sm:border sm:border-primary/25 sm:bg-surface/95 sm:p-9 sm:shadow-[0_24px_100px_#000a]" aria-labelledby="login-title">
          <div data-login-line aria-hidden className="absolute inset-x-10 top-0 h-px origin-left bg-gradient-to-r from-transparent via-primary to-accent" />
          <span data-login-step className="mb-7 hidden h-12 w-12 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary sm:flex"><ShieldCheck className="h-6 w-6" /></span>
          <p data-login-step className="mb-2 font-display text-xs uppercase tracking-[.28em] text-accent">Área da organização</p>
          <h2 data-login-step id="login-title" className="font-display text-4xl uppercase sm:text-5xl">Entre no jogo.</h2>
          <p data-login-step className="mb-6 mt-2 text-sm leading-relaxed text-muted-foreground sm:mb-8 sm:mt-3">Acesse o painel para organizar a Tamanda League.</p>
          <div data-login-step><LoginForm returnTo={target} /></div>
          <p className="mt-6 hidden border-t border-border pt-5 text-center text-xs text-muted-foreground sm:block">Acesso exclusivo para administradores.</p>
        </section>
      </div>

    </LoginMotion>
  );
}
