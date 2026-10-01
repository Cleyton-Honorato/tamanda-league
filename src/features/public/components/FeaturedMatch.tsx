import { CalendarDays, Clock } from 'lucide-react';
import { Chevrons } from '@/components/brand/Chevrons';
import { TeamShield } from '@/components/brand/TeamShield';
import { TribalBackdrop } from '@/components/brand/TribalBackdrop';
import { Container } from '@/components/layout/Container';
import { formatDate, formatTime } from '@/lib/format';
import { STAGE_LABELS, type GroupDto, type MatchDto } from '@/lib/types';
import { cn } from '@/lib/cn';

/** Faixa com o nome do time, em verde de um lado e laranja do outro. */
function TeamPill({
  name,
  side,
}: {
  name: string;
  side: 'green' | 'orange';
}) {
  return (
    <p
      className={cn(
        'w-full max-w-[16rem] truncate rounded-[var(--radius-md)] px-3 py-1.5 text-center',
        'font-display text-lg uppercase leading-tight text-background sm:text-xl lg:text-2xl',
        side === 'green'
          ? 'bg-primary shadow-[0_0_20px_rgba(22,201,86,0.35)]'
          : 'bg-accent shadow-[0_0_20px_rgba(255,116,23,0.35)]',
      )}
    >
      {name}
    </p>
  );
}

function InfoBox({
  icon: Icon,
  label,
  value,
  side,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  side: 'green' | 'orange';
}) {
  return (
    <div
      className={cn(
        'flex flex-1 items-center gap-3 rounded-[var(--radius-md)] border-2 bg-background/70 px-3 py-2.5 sm:px-4 sm:py-3',
        side === 'green' ? 'border-primary' : 'border-accent',
      )}
    >
      <Icon className="h-6 w-6 shrink-0 text-foreground sm:h-7 sm:w-7" />
      <div className="min-w-0">
        <p className="font-display text-sm uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <p className="truncate font-display text-xl uppercase leading-tight sm:text-2xl">
          {value}
        </p>
      </div>
    </div>
  );
}

/**
 * Seção "Jogo do dia" — recria a arte oficial com os dados reais do
 * campeonato. Ocupa a largura inteira da tela, como o hero.
 */
export function FeaturedMatch({
  match,
  groups,
}: {
  match: MatchDto | null;
  groups: GroupDto[];
}) {
  const finished = match?.status === 'FINISHED';
  const aWins = finished && (match.scoreA ?? 0) > (match.scoreB ?? 0);
  const bWins = finished && (match.scoreB ?? 0) > (match.scoreA ?? 0);
  const group = groups.find((item) => item.id === match?.groupId);

  const stageLabel =
    match?.stage === 'GROUP'
      ? (group?.name ?? 'Fase de grupos')
      : match ? STAGE_LABELS[match.stage] : 'Em breve';

  return (
    <section className="featured-match relative isolate flex min-h-[70svh] items-center overflow-hidden bg-background py-14 sm:min-h-[clamp(620px,85svh,850px)] lg:py-20">
      <TribalBackdrop />

      <Container wide className="relative z-10">
        <h2 className="mb-2 flex items-center justify-center gap-3 font-display text-4xl uppercase leading-none sm:text-5xl lg:text-6xl">
          <Chevrons className="scale-125 sm:scale-150" />
          <span className="bg-gradient-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
            Jogo
          </span>
          <span className="text-accent text-glow-orange">do dia</span>
          <Chevrons direction="left" className="scale-125 sm:scale-150" />
        </h2>

        <p className="mb-7 text-center font-display text-sm uppercase tracking-[0.3em] text-muted-foreground">
          {stageLabel}
        </p>

        {match ? <div className="mx-auto max-w-3xl">
          {/* Duas linhas — escudos e placar na primeira, faixas dos times na
              segunda — é o que deixa o VS na altura dos escudos, como na arte. */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center justify-items-center gap-x-3 gap-y-3 sm:gap-x-6">
            <TeamShield
              team={match.teamA}
              side="green"
              className="w-28 sm:w-36 lg:w-44"
            />

            {finished ? (
              <p className="font-display text-4xl leading-none sm:text-5xl lg:text-6xl">
                <span className={aWins ? 'text-primary' : 'text-muted-foreground'}>
                  {match.scoreA}
                </span>
                <span className="mx-1.5 text-muted-foreground">×</span>
                <span className={bWins ? 'text-primary' : 'text-muted-foreground'}>
                  {match.scoreB}
                </span>
              </p>
            ) : (
              <p className="bg-gradient-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text font-display text-5xl uppercase leading-none text-transparent drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] sm:text-6xl lg:text-7xl">
                VS
              </p>
            )}

            <TeamShield
              team={match.teamB}
              side="orange"
              className="w-28 sm:w-36 lg:w-44"
            />

            <TeamPill name={match.teamA?.name ?? 'A definir'} side="green" />
            <span aria-hidden />
            <TeamPill name={match.teamB?.name ?? 'A definir'} side="orange" />
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <InfoBox
              icon={CalendarDays}
              label="Data"
              value={match.scheduledAt ? formatDate(match.scheduledAt) : 'A definir'}
              side="green"
            />
            <InfoBox
              icon={Clock}
              label={finished ? 'Resultado' : 'Horário'}
              value={
                finished
                  ? 'Encerrado'
                  : match.scheduledAt
                    ? formatTime(match.scheduledAt)
                    : 'A definir'
              }
              side="orange"
            />
          </div>
        </div> : (
          <p className="mx-auto max-w-lg py-14 text-center font-display text-2xl uppercase tracking-[0.16em] text-foreground sm:py-20 sm:text-3xl">
            A tabela sai em breve
          </p>
        )}
      </Container>
    </section>
  );
}
