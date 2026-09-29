import Link from 'next/link';
import { ListOrdered, Trophy } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { Chevrons } from '@/components/brand/Chevrons';
import { SectionTitle } from '@/components/brand/SectionTitle';
import { Tabs } from '@/components/ui/Tabs';
import { EmptyState } from '@/components/ui/EmptyState';
import { MatchCard } from '@/features/public/components/MatchCard';
import { StandingsTable } from '@/features/public/components/StandingsTable';
import { Bracket } from '@/features/public/components/Bracket';
import { listGroups } from '@/server/services/groups';
import { getGroupStandings, listGroupMatches, listKnockoutMatches } from '@/server/services/matches';
import { getTeamsIndex } from '@/server/services/teams';
import { ROUTES } from '@/lib/constants';
import { cn } from '@/lib/cn';

export const revalidate = 60;
export const metadata = { title: 'Campeonato' };

export default async function CampeonatoPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const knockout = params.fase === 'mata-mata';
  const groups = knockout ? [] : await listGroups();
  const selected = groups.find((group) => group.id === params.grupo) ?? groups[0];
  const [matches, standings, teamsById] = await Promise.all([
    knockout ? listKnockoutMatches() : listGroupMatches(),
    selected ? getGroupStandings(selected.id) : Promise.resolve([]),
    selected ? getTeamsIndex() : Promise.resolve(new Map()),
  ]);
  const groupMatches = matches.filter((match) => match.groupId === selected?.id);
  const phases = [
    { label: 'Fase de grupos', href: ROUTES.campeonato, icon: ListOrdered, active: !knockout },
    { label: 'Mata-mata', href: ROUTES.chaveamento, icon: Trophy, active: knockout },
  ];

  return (
    <Container className="flex flex-col gap-7 py-8 sm:py-10">
      <header>
        <p className="mb-2 flex items-center gap-2 font-display text-sm uppercase tracking-[0.25em] text-primary">
          <Chevrons /> Tamanda League 3x3
        </p>
        <h1 className="font-display text-4xl uppercase sm:text-5xl">Campeonato</h1>
        <p className="mt-2 text-sm text-muted-foreground">Da fase de grupos à final. Acompanhe cada confronto.</p>
      </header>

      <nav aria-label="Fases do campeonato" className="grid grid-cols-2 gap-2 rounded-[var(--radius-lg)] border border-border bg-surface p-1.5">
        {phases.map(({ label, href, icon: Icon, active }) => (
          <Link key={href} href={href} aria-current={active ? 'page' : undefined}
            className={cn('flex items-center justify-center gap-2 rounded-[var(--radius-md)] border px-3 py-4 font-display text-lg uppercase tracking-wide transition-colors sm:text-xl',
              active ? 'border-primary/50 bg-primary/10 text-primary' : 'border-transparent text-muted-foreground hover:bg-elevated hover:text-foreground')}>
            <Icon aria-hidden className="h-5 w-5 shrink-0" />{label}
          </Link>
        ))}
      </nav>

      {knockout ? (
        <section aria-label="Mata-mata" className="min-w-0">
          <SectionTitle>Mata-mata</SectionTitle>
          {matches.length ? (
            <>
              <p className="mb-6 text-sm text-muted-foreground">Quem vence avança. No celular, deslize entre as rodadas.</p>
              <Bracket matches={matches} />
            </>
          ) : (
            <EmptyState title="Confrontos em breve" description="O mata-mata aparece aqui quando o chaveamento for definido." />
          )}
        </section>
      ) : !selected ? (
        <EmptyState title="Fase de grupos em breve" description="Os grupos, a classificação e os jogos vão aparecer aqui." />
      ) : (
        <section aria-label="Fase de grupos" className="flex min-w-0 flex-col gap-6">
          <Tabs items={groups.map((group) => ({ label: group.name, href: `${ROUTES.campeonato}?grupo=${group.id}`, active: group.id === selected.id }))} />
          <div className="grid min-w-0 items-start gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <section className="min-w-0">
              <SectionTitle>{selected.name} · Classificação</SectionTitle>
              {standings.length ? (
                <>
                  <StandingsTable rows={standings} teamsById={teamsById} />
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">J: jogos · V: vitórias · D: derrotas · +/−: saldo · Pts: pontos.<br />Vitória: 2 pontos. Derrota: 1 ponto.</p>
                </>
              ) : <EmptyState title="Times em breve" description="A classificação aparece após o cadastro dos times." />}
            </section>
            <section className="min-w-0">
              <SectionTitle>Jogos do grupo</SectionTitle>
              {groupMatches.length ? (
                <ul className="flex flex-col gap-3">
                  {groupMatches.map((match, index) => (
                    <li key={match.id}><MatchCard match={match} index={index} groups={groups} showDate /></li>
                  ))}
                </ul>
              ) : <EmptyState title="Jogos em breve" description="Os confrontos deste grupo ainda não foram publicados." />}
            </section>
          </div>
        </section>
      )}
    </Container>
  );
}
