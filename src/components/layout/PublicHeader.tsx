'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogoInline } from '@/components/brand/Logo';
import { BottomNav } from '@/components/layout/BottomNav';
import { Container } from '@/components/layout/Container';
import { ROUTES } from '@/lib/constants';
import { cn } from '@/lib/cn';
import { ShieldCheck } from 'lucide-react';

/**
 * Na home o cabeçalho começa transparente, sobreposto ao hero, e só ganha
 * fundo depois que a pessoa rola — é o que deixa a arte encostar no topo da
 * tela. Nas demais páginas ele já nasce sólido.
 */
export function PublicHeader() {
  const pathname = usePathname();
  const overlay = pathname === ROUTES.home;
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!overlay) return;

    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [overlay]);

  const solid = !overlay || scrolled;

  return (
    <header
      className={cn(
        'sticky top-0 z-30 transition-colors duration-300',
        solid
          ? 'border-b border-border bg-background/90 backdrop-blur'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      {/* Altura fixa: o hero da home usa esse mesmo valor na margem negativa
          para encostar no topo da tela. */}
      <Container
        wide
        className="flex h-16 items-center justify-between gap-3"
      >
        <Link href={ROUTES.home}>
          <LogoInline />
        </Link>
        <div className="flex items-center gap-3">
          <BottomNav variant="inline" />
          <Link href={ROUTES.adminLogin} className="inline-flex shrink-0 items-center gap-2 rounded-[var(--radius-md)] border border-primary/30 bg-background/70 px-3 py-2 font-display text-sm uppercase tracking-wide text-primary transition-colors hover:border-primary hover:bg-primary/10" aria-label="Entrar no painel administrativo">
            <ShieldCheck className="h-4 w-4" /><span className="hidden sm:inline">Painel admin</span><span className="sm:hidden">Admin</span>
          </Link>
        </div>
      </Container>
    </header>
  );
}
