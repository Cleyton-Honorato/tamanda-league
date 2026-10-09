import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { Hero } from '@/features/public/components/Hero';
import { SectionTitle } from '@/components/brand/SectionTitle';
import { FeaturedMatch } from '@/features/public/components/FeaturedMatch';
import { ChampionshipSections } from '@/features/public/components/ChampionshipSections';
import { Gallery } from '@/features/public/components/Gallery';
import { GalleryTeaser } from '@/features/public/components/GalleryTeaser';
import { GalleryTransition } from '@/features/public/components/GalleryTransition';
import { listMatches } from '@/server/services/matches';
import { listGroups } from '@/server/services/groups';
import { listMedia } from '@/server/services/media';
import { listTeams } from '@/server/services/teams';
import { pickFeaturedMatch } from '@/server/services/featured-match';

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

  const [matches, groups, teams, media] = await Promise.all([
    listMatches(),
    listGroups(),
    listTeams(),
    listMedia(),
  ]);

  const featured = pickFeaturedMatch(matches, new Date());

  return (
    <>
      <div id="inicio"><Hero wideArt={wideArt} /></div>

      <FeaturedMatch match={featured} groups={groups} />
      <ChampionshipSections groups={groups} teams={teams} matches={matches} />

      <GalleryTransition />

      {media.length > 0 && (
        <section id="galeria" className="flex min-h-[70svh] w-full scroll-mt-20 flex-col justify-center bg-surface py-12">
          <div className="px-5 sm:px-8">
          <SectionTitle>
            Galeria
          </SectionTitle>
          </div>
          <Gallery items={media} />
        </section>
      )}
      {media.length === 0 && <div id="galeria" className="scroll-mt-20"><GalleryTeaser /></div>}
    </>
  );
}
