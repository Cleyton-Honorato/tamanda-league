'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CalendarDays, ChevronDown, Trophy } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { cn } from '@/lib/cn';
import { ROUTES } from '@/lib/constants';

export function Hero({ wideArt }: { wideArt?: string | null }) {
  const artRef = useRef<HTMLDivElement>(null);

  // Parallax: a arte sobe mais devagar que o texto, dando profundidade sem
  // travar a rolagem — o cálculo roda uma vez por quadro.
  useEffect(() => {
    const art = artRef.current;
    if (!art) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;

    const update = () => {
      frame = 0;
      const offset = window.scrollY;
      // Depois que o hero sai da tela não há o que animar.
      if (offset > window.innerHeight) return;
      art.style.setProperty('--hero-shift', `${Math.min(offset * 0.08, 48)}px`);
      art.style.opacity = String(Math.max(0.15, 1 - offset / 900));
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section
      // `-mt-16` casa com a altura do cabeçalho, que fica transparente por cima.
      className={cn(
        'hero-section bg-court-glow relative isolate -mt-16 flex min-h-[74dvh] items-end overflow-hidden lg:min-h-[70dvh] lg:items-center',
      )}
    >
      {/* No celular a arte ocupa a parte de cima e o texto vem logo abaixo; no
          desktop ela toma a metade direita e o texto fica ao lado. */}
      <div
        ref={artRef}
        // A arte panorâmica cabe inteira à direita, sem ampliar por recorte.
        className={cn(
          'hero-art absolute inset-x-0 top-0 -z-20 h-[58%]',
          wideArt
            ? 'lg:inset-x-auto lg:inset-y-0 lg:right-0 lg:my-auto lg:h-[min(31.2vw,76dvh,793px)] lg:w-[78%] lg:max-w-[1983px]'
            : 'lg:inset-x-auto lg:inset-y-0 lg:right-0 lg:my-auto lg:h-[34rem] lg:w-[34rem] xl:h-[38rem] xl:w-[38rem]',
          wideArt && 'hero-art--wide',
        )}
      >
        <Image
          src="/brand/logo.jpg"
          alt=""
          fill
          sizes="(max-width: 1024px) 100vw, 38rem"
          loading="eager"
          fetchPriority="high"
          className={cn(
            'object-cover object-[center_26%] lg:object-center',
            wideArt && 'lg:hidden',
          )}
        />

        {wideArt && (
          <Image
            src={wideArt}
            alt=""
            fill
            sizes="(min-width: 1024px) 78vw, 100vw"
            loading="eager"
            fetchPriority="high"
            className="hidden object-contain object-right lg:block"
          />
        )}
      </div>

      {/* Funde a arte com o fundo: por baixo no celular, pela esquerda no
          desktop, onde fica o texto. */}
      <div
        aria-hidden
        className={cn(
          'absolute inset-0 -z-10 bg-gradient-to-b from-background/30 via-background/70 to-background lg:bg-gradient-to-r',
          // A arte panorâmica já é escura onde o texto entra, então só precisa
          // de um véu leve; com o logo solto o degradê tem de criar o fundo.
          wideArt
            ? 'lg:from-background/60 lg:via-background/10 lg:to-transparent'
            : 'lg:from-background lg:via-background/85 lg:to-transparent',
        )}
      />
      {/* Faixa alta de desvanecimento: é o que emenda o hero com a seção
          seguinte sem deixar um degrau de cor. */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 h-28 bg-gradient-to-t from-background via-background/60 to-transparent"
      />
      <Container wide className="pb-20 pt-24 lg:pb-16">
        <div className="flex max-w-2xl flex-col items-center gap-5 text-center lg:items-start lg:text-left">
          <h1
            className="hero-rise font-display text-6xl uppercase leading-[0.9] drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)] sm:text-7xl lg:text-8xl xl:text-[7.5rem]"
            style={{ animationDelay: '140ms' }}
          >
            Acompanhe
            <br />
            <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
              cada lance
            </span>
          </h1>

          <p
            className="hero-rise max-w-md text-base text-muted-foreground sm:text-lg xl:max-w-lg xl:text-xl"
            style={{ animationDelay: '220ms' }}
          >
            Jogos, classificação, chaveamento e as fotos do evento — tudo do
            campeonato do bairro em um só lugar.
          </p>

          <div
            className="hero-rise mt-1 flex flex-wrap justify-center gap-3 lg:justify-start"
            style={{ animationDelay: '300ms' }}
          >
            <Link
              href={ROUTES.jogos}
              className="inline-flex h-12 items-center gap-2 rounded-[var(--radius-md)] bg-primary px-6 font-display text-lg uppercase tracking-wide text-background shadow-[0_0_28px_rgba(22,201,86,0.4)] transition-transform hover:scale-[1.03] hover:bg-primary/90"
            >
              <CalendarDays className="h-5 w-5" />
              Fase de grupos
            </Link>
            <Link
              href={ROUTES.chaveamento}
              className="inline-flex h-12 items-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface/70 px-6 font-display text-lg uppercase tracking-wide text-foreground backdrop-blur transition-colors hover:border-accent hover:text-accent"
            >
              <Trophy className="h-5 w-5" />
              Mata-mata
            </Link>
          </div>
        </div>
      </Container>

      <div aria-hidden className="hero-divider" />

      <ChevronDown
        aria-hidden
        className="absolute bottom-6 left-1/2 h-6 w-6 -translate-x-1/2 animate-bounce text-muted-foreground/60"
      />
    </section>
  );
}
