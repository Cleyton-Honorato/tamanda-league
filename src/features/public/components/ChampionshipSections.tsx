import { Container } from '@/components/layout/Container';
import { SectionTitle } from '@/components/brand/SectionTitle';
import { EmptyState } from '@/components/ui/EmptyState';
import { MatchCard } from './MatchCard';
import { StandingsTable } from './StandingsTable';
import { Bracket } from './Bracket';
import { computeStandings } from '@/server/services/standings';
import type { GroupDto, MatchDto, TeamDto } from '@/lib/types';

export function ChampionshipSections({
  groups,
  teams,
  matches,
}: {
  groups: GroupDto[];
  teams: TeamDto[];
  matches: MatchDto[];
}) {
  const teamsById = new Map(teams.map((team) => [team.id, team]));
  const knockoutMatches = matches.filter((match) => match.stage !== 'GROUP');

  return (
    <div className="border-t border-border bg-background">
      <section id="fase-de-grupos" aria-labelledby="grupos-title" className="scroll-mt-20 py-14 sm:py-20">
        <Container wide>
          <header className="mb-8">
            <p className="mb-2 font-display text-sm uppercase tracking-[0.25em] text-accent">O campeonato</p>
            <h2 id="grupos-title" className="font-display text-4xl uppercase sm:text-5xl">Fase de grupos</h2>
            <p className="mt-2 text-sm text-muted-foreground">Classificação e confrontos das duas conferências.</p>
          </header>

          {groups.length === 0 ? (
            <EmptyState title="Grupos em breve" description="As conferências aparecem aqui quando forem definidas." />
          ) : (
            <div className="grid items-start gap-6 xl:grid-cols-2">
              {groups.map((group) => {
                const groupTeams = teams.filter((team) => team.groupId === group.id);
                const tone = group.name.toLowerCase().includes('laranja') ? 'orange' : 'green';
                const groupMatches = matches.filter((match) => match.stage === 'GROUP' && match.groupId === group.id);
                const finished = groupMatches.flatMap((match) =>
                  match.status === 'FINISHED' && match.teamA && match.teamB && match.scoreA !== null && match.scoreB !== null
                    ? [{ teamAId: match.teamA.id, teamBId: match.teamB.id, scoreA: match.scoreA, scoreB: match.scoreB }]
                    : [],
                );
                const standings = computeStandings(groupTeams.map((team) => team.id), finished);

                return (
                  <article key={group.id} className={`min-w-0 border bg-surface p-4 sm:p-6 ${tone === 'orange' ? 'border-accent/40' : 'border-primary/40'}`}>
                    <SectionTitle tone={tone}>{group.name}</SectionTitle>
                    {standings.length > 0 ? (
                      <>
                        <StandingsTable rows={standings} teamsById={teamsById} qualifyingSpots={Math.min(2, Math.floor(groupTeams.length / 2))} tone={tone} />
                        <p className="mt-2 text-xs text-muted-foreground">J: jogos · V: vitórias · D: derrotas · +/−: saldo · Pts: pontos</p>
                      </>
                    ) : (
                      <EmptyState title="Times em breve" description="Os times deste grupo ainda não foram definidos." />
                    )}

                    <div className="mt-7 border-t border-border pt-5">
                      <h3 className="mb-3 font-display text-xl uppercase">Jogos do grupo</h3>
                      {groupMatches.length > 0 ? (
                        <>
                          <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                            {groupMatches.slice(0, 4).map((match, index) => (
                              <li key={match.id}><MatchCard match={match} index={index} groups={groups} showDate /></li>
                            ))}
                          </ul>
                          {groupMatches.length > 4 && (
                            <details className="mt-3 border-t border-border pt-3">
                              <summary className={`w-fit cursor-pointer font-display text-sm uppercase tracking-wider focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary ${tone === 'orange' ? 'text-accent' : 'text-primary'}`}>
                                Ver mais {groupMatches.length - 4} jogos
                              </summary>
                              <ul className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                                {groupMatches.slice(4).map((match, index) => (
                                  <li key={match.id}><MatchCard match={match} index={index + 4} groups={groups} showDate /></li>
                                ))}
                              </ul>
                            </details>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">Os confrontos deste grupo ainda não foram publicados.</p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </Container>
      </section>

      <section id="mata-mata" aria-labelledby="mata-mata-title" className="scroll-mt-20 border-t border-border bg-surface py-14 sm:py-20">
        <Container wide>
          <header className="mb-8">
            <p className="mb-2 font-display text-sm uppercase tracking-[0.25em] text-accent">Rumo à final</p>
            <h2 id="mata-mata-title" className="font-display text-4xl uppercase sm:text-5xl">Mata-mata</h2>
            <p className="mt-2 text-sm text-muted-foreground">Quem vence avança. Acompanhe o caminho até o título.</p>
          </header>
          {knockoutMatches.length > 0 ? (
            <Bracket matches={knockoutMatches} />
          ) : (
            <EmptyState title="Confrontos em breve" description="O chaveamento aparece aqui quando o mata-mata for definido." />
          )}
        </Container>
      </section>
    </div>
  );
}
