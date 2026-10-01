import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { ROUTES } from '@/lib/constants';

const links = [
  { label: 'Início', href: ROUTES.home },
  { label: 'Fase de grupos', href: ROUTES.campeonato },
  { label: 'Mata-mata', href: ROUTES.chaveamento },
  { label: 'Galeria', href: ROUTES.galeria },
];

export function PublicFooter() {
  return (
    <footer className="relative isolate overflow-hidden border-t border-border bg-background pb-[calc(5rem+env(safe-area-inset-bottom,0px))] text-foreground lg:pb-0">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 flex h-1">
        <span className="w-2/3 bg-primary-muted" />
        <span className="w-1/3 bg-accent-muted" />
      </div>

      <svg aria-hidden="true" viewBox="0 0 520 460" fill="none" className="pointer-events-none absolute -right-24 top-0 hidden h-full w-[min(42vw,520px)] opacity-40 lg:block">
        <path d="M520 0H395L155 230 395 460H520L270 230Z" fill="var(--green-dark)" />
        <path d="M520 70 355 230 520 390" stroke="var(--green-muted)" strokeWidth="26" />
        <path d="M520 130 420 230 520 330" stroke="var(--orange-dark)" strokeWidth="18" />
      </svg>

      <Container wide className="relative z-10 py-9 sm:py-10 lg:py-11">
        <div className="grid gap-9 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-12">
          <div>
            <Link href={ROUTES.home} aria-label="Tamanda League 3x3 — início" className="inline-block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
              <Image src="/brand/header-logo.webp" alt="Tamanda League 3x3" width={1200} height={155} className="h-auto w-[215px] sm:w-[250px]" />
            </Link>
            <p className="mt-5 max-w-[15ch] font-display text-4xl uppercase leading-[0.95] sm:text-5xl">
              Da quadra <span className="text-primary">pra comunidade.</span>
            </p>
            <Link href={ROUTES.campeonato} className="mt-5 inline-flex min-h-11 items-center gap-3 border border-primary-muted bg-primary-dark px-4 font-display text-base uppercase tracking-[0.08em] text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
              Ver campeonato <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-[1.1fr_.9fr] gap-4 sm:gap-8 lg:pt-2">
            <nav aria-label="Links do rodapé">
              <h2 className="mb-4 font-display text-sm uppercase tracking-[0.22em] text-accent">Explorar</h2>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="font-display text-lg uppercase tracking-[0.03em] text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div>
              <h2 className="mb-4 font-display text-sm uppercase tracking-[0.22em] text-accent">Organização</h2>
              <Link href={ROUTES.adminLogin} className="inline-flex items-center gap-2 font-display text-lg uppercase tracking-[0.03em] text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                Área admin <ArrowUpRight size={17} className="text-primary" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-9 flex flex-col gap-2 border-t border-border pt-4 font-display text-xs uppercase tracking-[0.15em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Tamanda League 3x3</span>
          <span>Basquete · Respeito · Comunidade</span>
        </div>
      </Container>
    </footer>
  );
}
