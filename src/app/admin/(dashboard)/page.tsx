import Link from 'next/link';
import { ArrowUpRight, CalendarDays, CheckCircle2, Trophy, Users } from 'lucide-react';
import { CourtLines } from '@/components/brand/CourtLines';
import { Chevrons } from '@/components/brand/Chevrons';
import { Card } from '@/components/ui/Card';
import { SectionTitle } from '@/components/brand/SectionTitle';
import { EmptyState } from '@/components/ui/EmptyState';
import { MatchRow } from '@/features/admin/components/MatchRow';
import { countMatches, getGroupStandings, getTopScorer, listMatches } from '@/server/services/matches';
import { listTeams } from '@/server/services/teams';
import { listGroups } from '@/server/services/groups';
import { listAthletes } from '@/server/services/athletes';

export const metadata = { title: 'Painel' };

function Stat({
  label,
  value,
  icon: Icon,
  href,
}: {
  label: string;
  value: number;
  icon: typeof Users;
  href: string;
}) {
  return (
    <Link href={href} className="group min-w-0">
      <Card className="h-full p-4 transition-colors group-hover:border-primary/50 xl:p-5">
        <div className="mb-5 flex items-center justify-between gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/15 bg-primary/[0.07] text-primary">
            <Icon className="h-[18px] w-[18px]" />
          </span>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
        </div>
        <span className="block font-display text-5xl leading-none">{value}</span>
        <span className="mt-2 block text-sm text-muted-foreground">{label}</span>
      </Card>
    </Link>
  );
}

export default async function AdminDashboardPage() {
  const [athletes, teams, groups, matchCounts, topScorer, matches] = await Promise.all([
    listAthletes(),
    listTeams(),
    listGroups(),
    countMatches(),
    getTopScorer(),
    listMatches(),
  ]);

  const upcoming = matches
    .filter((match) => match.status === 'SCHEDULED' && match.scheduledAt)
    .slice(0, 5);
  const standings = await Promise.all(groups.map((group) => getGroupStandings(group.id)));
  const teamById = new Map(teams.map((team) => [team.id, team]));
  const waitingAthletes = athletes.filter((athlete) => !athlete.teamId).length;
  const topAthlete = athletes.find((athlete) => athlete.id === topScorer?.athleteId);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 font-display text-xs uppercase tracking-[0.3em] text-primary">Tamanda League 3x3</p>
          <h1 className="font-display text-4xl uppercase tracking-wide sm:text-5xl">Visão geral</h1>
        </div>
        <span className="rounded-full border border-primary/25 bg-primary/[0.06] px-3 py-1.5 text-xs text-primary">
          {matchCounts.finished > 0 ? 'Campeonato em andamento' : matchCounts.total > 0 ? 'Fase de grupos definida' : teams.length > 0 ? 'Times em organização' : 'Preparação do campeonato'}
        </span>
      </div>

      <section className="admin-overview-banner relative isolate overflow-hidden rounded-[var(--radius-lg)] border border-primary/20 p-5 sm:p-7">
        <CourtLines className="pointer-events-none absolute -right-12 -top-16 -z-10 w-[28rem] rotate-12 text-primary/15" />
        <div className="relative flex flex-col justify-between gap-6 xl:flex-row xl:items-center">
          <div>
            <p className="mb-3 flex items-center gap-2 font-display text-sm uppercase tracking-[0.18em] text-accent"><Chevrons /> Organização do campeonato</p>
            <h2 className="font-display text-3xl uppercase sm:text-4xl">{waitingAthletes} {waitingAthletes === 1 ? 'atleta aguardando time' : 'atletas aguardando time'}</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">Acompanhe os inscritos e organize as equipes nas duas conferências.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/atletas" className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-primary px-5 py-3 font-display text-base uppercase tracking-wide text-background transition-colors hover:bg-primary/90">Gerenciar atletas <ArrowUpRight className="h-4 w-4" /></Link>
            <Link href="/admin/times" className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-border bg-background/50 px-5 py-3 font-display text-base uppercase tracking-wide transition-colors hover:border-accent hover:text-accent">Organizar times</Link>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <Stat label="Atletas" value={athletes.length} icon={Users} href="/admin/atletas" />
        <Stat label="Times" value={teams.length} icon={Users} href="/admin/times" />
        <Stat
          label="Confrontos definidos"
          value={matchCounts.total}
          icon={CalendarDays}
          href="/admin/jogos"
        />
        <Stat
          label="Jogos encerrados"
          value={matchCounts.finished}
          icon={CheckCircle2}
          href="/admin/jogos"
        />
        <Link href="/admin/jogos" className="group min-w-0">
          <Card className="h-full p-4 transition-colors group-hover:border-accent/50 xl:p-5">
            <div className="mb-5 flex items-center justify-between gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-accent/30 bg-accent/[0.07] text-accent"><Trophy className="h-[18px] w-[18px]" /></span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-accent" />
            </div>
            <span className="block font-display text-5xl leading-none text-accent">{topScorer?.points ?? '—'}</span>
            <span className="mt-2 block text-sm text-muted-foreground">Cestinha · {topScorer ? 'pontos' : 'aguardando cestas'}</span>
            {topScorer && <span className="mt-1 block truncate font-display text-base uppercase" title={topAthlete?.name ?? topScorer.name}>{topAthlete?.nickname || topAthlete?.name || topScorer.name}</span>}
          </Card>
        </Link>
      </div>

      <section>
        <SectionTitle action={{ label: 'Gerenciar times', href: '/admin/times' }}>Grupos do campeonato</SectionTitle>
        {groups.length === 0 ? <EmptyState title="Grupos ainda não definidos" description="Cadastre as duas conferências para organizar os times." /> : (
          <div className="grid gap-4 xl:grid-cols-2">
            {groups.map((group, index) => {
              const groupTeams = teams.filter((team) => team.groupId === group.id);
              const groupMatches = matches.filter((match) => match.stage === 'GROUP' && match.groupId === group.id);
              const finished = groupMatches.filter((match) => match.status === 'FINISHED').length;
              const ranked = finished > 0
                ? standings[index]
                : [...standings[index]].sort((a, b) => (teamById.get(a.teamId)?.name ?? '').localeCompare(teamById.get(b.teamId)?.name ?? '', 'pt-BR'));
              const orange = group.name.toLowerCase().includes('laranja');
              return <div key={group.id} className={`min-w-0 overflow-hidden rounded-[var(--radius-lg)] border bg-surface ${orange ? 'border-accent/40' : 'border-primary/40'}`}>
                <div className={`flex flex-wrap items-end justify-between gap-3 border-b p-5 ${orange ? 'border-accent/25 bg-accent/[0.05]' : 'border-primary/25 bg-primary/[0.05]'}`}>
                  <div>
                    <p className={`font-display text-xs uppercase tracking-[.22em] ${orange ? 'text-accent' : 'text-primary'}`}>Fase de grupos</p>
                    <h2 className="mt-1 font-display text-3xl uppercase">{group.name}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">{groupTeams.length} times · {finished}/{groupMatches.length} jogos encerrados</p>
                  </div>
                  <Link href="/admin/jogos" className={`font-display text-sm uppercase tracking-wide transition-colors hover:underline ${orange ? 'text-accent' : 'text-primary'}`}>Ver jogos <ArrowUpRight className="inline h-4 w-4" /></Link>
                </div>
                {ranked.length === 0 ? <p className="p-6 text-sm text-muted-foreground">Nenhum time neste grupo. Organize os elencos para começar.</p> : <div className="overflow-x-auto">
                  <table className="w-full min-w-[390px] text-left text-sm">
                    <thead className="border-b border-border bg-background/40 font-display text-xs uppercase tracking-wider text-muted-foreground"><tr><th scope="col" className="px-4 py-3">Time</th><th scope="col" className="px-2 py-3 text-center">J</th><th scope="col" className="px-2 py-3 text-center">V</th><th scope="col" className="px-2 py-3 text-center">D</th><th scope="col" className="px-4 py-3 text-right">Pts</th></tr></thead>
                    <tbody>{ranked.map((row, position) => {
                      const team = teamById.get(row.teamId);
                      if (!team) return null;
                      return <tr key={row.teamId} className="border-b border-border/70 last:border-0">
                        <th scope="row" className="px-4 py-3 font-normal"><div className="flex min-w-0 items-center gap-3"><span className="w-5 shrink-0 font-display text-xs text-muted-foreground">{position + 1}</span><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-display text-xs ${orange ? 'border-accent/60' : 'border-primary/60'}`}>{team.shortName.slice(0, 3)}</span><span className="min-w-0 truncate font-display text-base uppercase" title={team.name}>{team.name}</span></div></th>
                        <td className="px-2 py-3 text-center text-muted-foreground">{row.played}</td><td className="px-2 py-3 text-center text-muted-foreground">{row.wins}</td><td className="px-2 py-3 text-center text-muted-foreground">{row.losses}</td><td className={`px-4 py-3 text-right font-display text-base ${orange ? 'text-accent' : 'text-primary'}`}>{row.points}</td>
                      </tr>;
                    })}</tbody>
                  </table>
                  {finished === 0 && <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground">Classificação inicial · ordem alfabética até o primeiro resultado.</p>}
                </div>}
              </div>;
            })}
          </div>
        )}
      </section>

      <section className="min-w-0 rounded-[var(--radius-lg)] border border-border bg-surface/40 p-4 sm:p-5">
        <SectionTitle action={{ label: 'Ver todos', href: '/admin/jogos' }}>Próximos jogos</SectionTitle>
        {upcoming.length === 0 ? <EmptyState title="Nenhum jogo agendado" description={teams.length === 0 ? 'Os confrontos serão definidos depois da formação dos times.' : groups.length === 0 ? 'Comece criando as conferências e cadastrando os atletas.' : 'Monte e agende os jogos da fase de grupos para eles aparecerem aqui.'} /> : <ul className="flex flex-col gap-2">{upcoming.map((match, index) => <li key={match.id}><MatchRow match={match} index={index} groups={groups} readOnly /></li>)}</ul>}
      </section>
    </div>
  );
}
