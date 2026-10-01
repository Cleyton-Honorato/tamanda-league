'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { BottomNav } from '@/components/layout/BottomNav';
import { Container } from '@/components/layout/Container';
import { ROUTES } from '@/lib/constants';
import { cn } from '@/lib/cn';
import { ArrowUpRight } from 'lucide-react';

/**
 * Na home o cabeçalho começa transparente, sobreposto ao hero, e só ganha
 * fundo depois que a pessoa rola — é o que deixa a arte encostar no topo da
 * tela. Nas demais páginas ele já nasce sólido.
 */
export function PublicHeader() {
  const pathname = usePathname();
  const overlay = pathname === ROUTES.home;
  const [scrolled, setScrolled] = useState(false);
  const progressRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setScrolled(window.scrollY > 24);
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0;
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${progress})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [overlay]);

  const solid = !overlay || scrolled;

  return (
    <header
      className={cn(
        'site-header sticky top-0 z-30 transition-[background-color,border-color] duration-300',
        solid
          ? 'border-b border-white/10 bg-[#080e0b]/95 backdrop-blur-md'
          : 'border-b border-white/10 bg-gradient-to-b from-black/45 to-transparent',
      )}
    >
      {/* Altura fixa: o hero da home usa esse mesmo valor na margem negativa
          para encostar no topo da tela. */}
      <Container
        wide
        className="flex h-16 items-center justify-between gap-3"
      >
        <Link href={ROUTES.home} aria-label="Tamanda League 3x3 — início" className="site-header__brand inline-flex min-w-0 items-center focus-visible:outline-2 focus-visible:outline-primary">
          <Image src="/brand/header-logo.webp" alt="Tamanda League 3x3" width={1200} height={155} priority className="h-auto w-[185px] sm:w-[248px] lg:w-[270px]" />
        </Link>
        <div className="flex h-full items-center gap-4 lg:gap-8">
          <BottomNav variant="inline" />
          <span aria-hidden className="hidden h-5 w-px bg-white/20 lg:block" />
          <Link href={ROUTES.adminLogin} className="site-header__admin inline-flex shrink-0 items-center gap-1.5 font-display text-sm uppercase tracking-[0.12em] text-white/80 transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-primary" aria-label="Entrar no painel administrativo">
            <span className="hidden sm:inline">Área admin</span><span className="sm:hidden">Admin</span><ArrowUpRight className="h-4 w-4 text-primary" aria-hidden />
          </Link>
        </div>
      </Container>
      <span ref={progressRef} aria-hidden className="absolute inset-x-0 bottom-[-1px] h-[2px] origin-left scale-x-0 bg-gradient-to-r from-primary via-primary to-accent" />
    </header>
  );
}
