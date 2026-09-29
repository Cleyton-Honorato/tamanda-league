import Link from 'next/link';
import { ArrowUpRight, CalendarDays, CheckCircle2, Images, Users } from 'lucide-react';
import { CourtLines } from '@/components/brand/CourtLines';
import { Chevrons } from '@/components/brand/Chevrons';
import { Card } from '@/components/ui/Card';
import { SectionTitle } from '@/components/brand/SectionTitle';
import { EmptyState } from '@/components/ui/EmptyState';
import { MatchRow } from '@/features/admin/components/MatchRow';
import { countMatches, listMatches } from '@/server/services/matches';
import { listTeams } from '@/server/services/teams';
import { countMedia } from '@/server/services/media';
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
  const [athletes, teams, groups, matchCounts, mediaCount, matches] = await Promise.all([
    listAthletes(),
    listTeams(),
    listGroups(),
    countMatches(),
    countMedia(),
    listMatches(),
  ]);

  const upcoming = matches
    .filter((match) => match.status === 'SCHEDULED' && match.scheduledAt)
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 font-display text-xs uppercase tracking-[0.3em] text-primary">Tamanda League 3x3</p>
          <h1 className="font-display text-4xl uppercase tracking-wide sm:text-5xl">Visão geral</h1>
        </div>
        <span className="rounded-full border border-primary/25 bg-primary/[0.06] px-3 py-1.5 text-xs text-primary">
          {matchCounts.finished > 0 ? 'Campeonato em andamento' : teams.length > 0 ? 'Times em organização' : 'Preparação do campeonato'}
        </span>
      </div>

      <section className="admin-overview-banner relative isolate overflow-hidden rounded-[var(--radius-lg)] border border-primary/20 p-5 sm:p-7">
        <CourtLines className="pointer-events-none absolute -right-12 -top-16 -z-10 w-[28rem] rotate-12 text-primary/15" />
        <div className="relative flex flex-col justify-between gap-6 xl:flex-row xl:items-center">
          <div>
            <p className="mb-3 flex items-center gap-2 font-display text-sm uppercase tracking-[0.18em] text-accent"><Chevrons /> Organização do campeonato</p>
            <h2 className="font-display text-3xl uppercase sm:text-4xl">{athletes.filter((athlete) => !athlete.teamId).length} atletas aguardando time</h2>
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
          label="Jogos agendados"
          value={matchCounts.scheduled}
          icon={CalendarDays}
          href="/admin/jogos"
        />
        <Stat
          label="Jogos encerrados"
          value={matchCounts.finished}
          icon={CheckCircle2}
          href="/admin/jogos"
        />
        <Stat
          label="Mídias"
          value={mediaCount}
          icon={Images}
          href="/admin/galeria"
        />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <section className="min-w-0 rounded-[var(--radius-lg)] border border-border bg-surface/40 p-4 sm:p-5">
        <SectionTitle action={{ label: 'Ver todos', href: '/admin/jogos' }}>
          Próximos jogos
        </SectionTitle>

        {upcoming.length === 0 ? (
          <EmptyState
            title="Nenhum jogo agendado"
            description={
              teams.length === 0
                ? 'Os confrontos serão definidos depois da formação dos times.'
                : groups.length === 0
                ? 'Comece criando as conferências e cadastrando os atletas.'
                : 'Agende os jogos da fase de grupos para eles aparecerem aqui.'
            }
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {upcoming.map((match, index) => (
              <li key={match.id}>
                <MatchRow match={match} index={index} groups={groups} readOnly />
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="rounded-[var(--radius-lg)] border border-border bg-surface/40 p-4 sm:p-5">
        <SectionTitle action={{ label: 'Gerenciar', href: '/admin/grupos' }}>Conferências</SectionTitle>
        {groups.length === 0 ? <p className="text-sm text-muted-foreground">As conferências ainda não foram definidas.</p> : (
          <ul className="flex flex-col gap-3">
            {groups.map((group, index) => (
              <li key={group.id}>
                <Link href="/admin/grupos" className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border bg-surface p-4 transition-colors hover:border-foreground/30">
                  <div className={`border-l-2 pl-3 ${index % 2 ? 'border-accent' : 'border-primary'}`}>
                    <p className={`font-display text-xl uppercase ${index % 2 ? 'text-accent' : 'text-primary'}`}>{group.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{teams.filter((team) => team.groupId === group.id).length} times</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      </div>
    </div>
  );
}
