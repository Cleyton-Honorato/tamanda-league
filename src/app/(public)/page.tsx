import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { Container } from '@/components/layout/Container';
import { Hero } from '@/features/public/components/Hero';
import { SectionTitle } from '@/components/brand/SectionTitle';
import { MatchCard } from '@/features/public/components/MatchCard';
import { FeaturedMatch } from '@/features/public/components/FeaturedMatch';
import { Gallery } from '@/features/public/components/Gallery';
import { GalleryTeaser } from '@/features/public/components/GalleryTeaser';
import { GalleryTransition } from '@/features/public/components/GalleryTransition';
import { listMatches } from '@/server/services/matches';
import { listGroups } from '@/server/services/groups';
import { listMedia } from '@/server/services/media';
import { pickFeaturedMatch } from '@/server/services/featured-match';
import { ROUTES } from '@/lib/constants';

// Rede de segurança: as páginas também são revalidadas sob demanda quando o
// admin altera algo.
export const revalidate = 60;

/**
 * Arte panorâmica do hero (quadra + logo), usada só no desktop. Fica opcional
 * porque é um arquivo que o organizador coloca na pasta `public/brand`; sem
 * ele o hero cai no logo quadrado.
 */
function findWideHeroArt(): string | null {
  for (const file of ['hero.jpg', 'hero.png', 'hero.webp']) {
    if (existsSync(join(process.cwd(), 'public', 'brand', file))) {
      return `/brand/${file}`;
    }
  }
  return null;
}

export default async function HomePage() {
  const wideArt = findWideHeroArt();

  const [matches, groups, media] = await Promise.all([
    listMatches(),
    listGroups(),
    listMedia(4),
  ]);

  const featured = pickFeaturedMatch(matches, new Date());

  const upcoming = matches
    .filter(
      (match) =>
        match.status === 'SCHEDULED' &&
        match.scheduledAt &&
        match.id !== featured?.id,
    )
    .slice(0, 4);

  const results = matches
    .filter((match) => match.status === 'FINISHED' && match.id !== featured?.id)
    .sort((a, b) => (b.scheduledAt ?? '').localeCompare(a.scheduledAt ?? ''))
    .slice(0, 3);

  return (
    <>
      <Hero wideArt={wideArt} />

      <FeaturedMatch match={featured} groups={groups} />

      {(upcoming.length > 0 || results.length > 0) && (
      <Container className="flex flex-col gap-10 py-8">
      {upcoming.length > 0 && (
        <section>
          <SectionTitle action={{ label: 'Ver todos', href: ROUTES.jogos }}>
            Próximos jogos
          </SectionTitle>
          {/* Dois cards por linha a partir do tablet; no celular a coluna
              única continua sendo a leitura mais confortável. */}
          <ul className="grid gap-3 md:grid-cols-2">
            {upcoming.map((match, index) => (
              <li key={match.id}>
                <MatchCard match={match} index={index} groups={groups} showDate />
              </li>
            ))}
          </ul>
        </section>
      )}

      {results.length > 0 && (
        <section>
          <SectionTitle action={{ label: 'Ver todos', href: ROUTES.jogos }}>
            Últimos resultados
          </SectionTitle>
          <ul className="grid gap-3 md:grid-cols-2">
            {results.map((match, index) => (
              <li key={match.id}>
                <MatchCard match={match} index={index} groups={groups} showDate />
              </li>
            ))}
          </ul>
        </section>
      )}

      </Container>
      )}

      <GalleryTransition />

      {media.length > 0 && (
        <section className="flex min-h-[70svh] w-full flex-col justify-center bg-surface py-12">
          <div className="px-5 sm:px-8">
          <SectionTitle action={{ label: 'Ver galeria', href: ROUTES.galeria }}>
            Galeria
          </SectionTitle>
          </div>
          <Gallery items={media} />
        </section>
      )}
      {media.length === 0 && <GalleryTeaser />}
    </>
  );
}
