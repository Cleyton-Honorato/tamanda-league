'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogoInline } from '@/components/brand/Logo';
import { BottomNav } from '@/components/layout/BottomNav';
import { Container } from '@/components/layout/Container';
import { ROUTES } from '@/lib/constants';
import { cn } from '@/lib/cn';

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
        <BottomNav variant="inline" />
      </Container>
    </header>
  );
}
