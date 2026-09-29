'use client';

import { useRef, useState } from 'react';
import { Clock, Trophy } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatDateTimeShort } from '@/lib/format';
import {
  KNOCKOUT_STAGES,
  STAGE_LABELS,
  type KnockoutStage,
  type MatchDto,
} from '@/lib/types';

function TeamLine({
  team,
  score,
  isWinner,
  decided,
}: {
  team: MatchDto['teamA'];
  score: number | null;
  isWinner: boolean;
  decided: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-2 px-2.5 py-2',
        decided && !isWinner && 'opacity-50',
      )}
    >
      <span
        className={cn(
          'min-w-0 truncate font-display text-base uppercase leading-tight',
          !team && 'italic text-muted-foreground',
          isWinner && 'text-primary',
        )}
      >
        {team?.shortName ?? 'A definir'}
      </span>

      {score !== null && (
        <span
          className={cn(
            'shrink-0 font-display text-lg leading-none',
            isWinner ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          {score}
        </span>
      )}
    </div>
  );
}

function BracketMatch({ match, isFinal }: { match: MatchDto; isFinal: boolean }) {
  const decided = match.status === 'FINISHED';
  const aWins = decided && (match.scoreA ?? 0) > (match.scoreB ?? 0);
  const bWins = decided && (match.scoreB ?? 0) > (match.scoreA ?? 0);
  const empty = !match.teamA && !match.teamB;

  return (
    <div
      className={cn(
        'overflow-hidden rounded-[var(--radius-md)] border bg-surface',
        empty ? 'border-dashed border-border' : 'border-border',
        isFinal && 'border-accent shadow-[0_0_24px_rgba(255,116,23,0.2)]',
      )}
    >
      <TeamLine
        team={match.teamA}
        score={match.scoreA}
        isWinner={aWins}
        decided={decided}
      />
      <div className="h-px bg-border" />
      <TeamLine
        team={match.teamB}
        score={match.scoreB}
        isWinner={bWins}
        decided={decided}
      />

      {match.scheduledAt && !decided && (
        <p className="flex items-center gap-1 border-t border-border bg-elevated px-2.5 py-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {formatDateTimeShort(match.scheduledAt)}
        </p>
      )}
    </div>
  );
}

/**
 * Chaveamento. No celular cada rodada ocupa quase a tela inteira e o dedo
 * desliza entre elas com encaixe (scroll-snap); a partir de `lg` as rodadas
 * aparecem lado a lado.
 */
export function Bracket({ matches }: { matches: MatchDto[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const columnRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const present = KNOCKOUT_STAGES.filter((stage) =>
    matches.some((match) => match.stage === stage),
  );
  const [activeStage, setActiveStage] = useState<KnockoutStage>(
    present[0] ?? 'F',
  );

  const champion = (() => {
    const final = matches.find((match) => match.stage === 'F');
    if (!final || final.status !== 'FINISHED') return null;
    return (final.scoreA ?? 0) > (final.scoreB ?? 0) ? final.teamA : final.teamB;
  })();

  function goTo(stage: KnockoutStage) {
    setActiveStage(stage);

    const container = containerRef.current;
    const column = columnRefs.current[stage];
    if (!container || !column) return;

    // `scrollIntoView` briga com o scroll-snap e para no meio do caminho;
    // calcular o deslocamento e rolar o container resolve. O padding lateral
    // entra na conta para a coluna não encostar na borda da tela.
    const padding = parseFloat(getComputedStyle(container).paddingLeft) || 0;
    const left =
      column.getBoundingClientRect().left -
      container.getBoundingClientRect().left +
      container.scrollLeft -
      padding;

    container.scrollTo({ left, behavior: 'smooth' });
  }

  return (
    <div className="flex flex-col gap-4">
      <nav className="no-scrollbar -mx-5 overflow-x-auto px-5 lg:hidden">
        <ul className="flex gap-2">
          {present.map((stage) => (
            <li key={stage}>
              <button
                type="button"
                onClick={() => goTo(stage)}
                aria-current={activeStage === stage ? 'step' : undefined}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 font-display text-sm uppercase tracking-wider whitespace-nowrap transition-colors',
                  activeStage === stage
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground',
                )}
              >
                {STAGE_LABELS[stage]}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div
        ref={containerRef}
        className="no-scrollbar -mx-5 flex snap-x snap-mandatory scroll-pl-5 gap-4 overflow-x-auto px-5 lg:mx-0 lg:snap-none lg:justify-between lg:gap-6 lg:overflow-visible lg:px-0"
      >
        {present.map((stage) => {
          const stageMatches = matches
            .filter((match) => match.stage === stage)
            .sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0));

          return (
            <div
              key={stage}
              ref={(node) => {
                columnRefs.current[stage] = node;
              }}
              className="w-[82vw] shrink-0 snap-start sm:w-[60vw] lg:w-auto lg:flex-1"
            >
              <h2 className="mb-3 font-display text-lg uppercase tracking-widest text-muted-foreground">
                {STAGE_LABELS[stage]}
              </h2>

              {/* No desktop o espaçamento uniforme alinha cada par com o jogo
                  seguinte, dispensando conectores desenhados. No celular só se
                  vê uma rodada por vez, então os cards ficam juntos no topo. */}
              <div className="flex h-full flex-col gap-3 lg:justify-around">
                {stageMatches.map((match) => (
                  <BracketMatch
                    key={match.id}
                    match={match}
                    isFinal={stage === 'F'}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {champion && (
        <div className="flex flex-col items-center gap-1.5 rounded-[var(--radius-lg)] border border-accent bg-accent/10 px-5 py-5 text-center">
          <Trophy className="h-7 w-7 text-accent" />
          <p className="font-display text-sm uppercase tracking-[0.3em] text-muted-foreground">
            Campeão
          </p>
          <p className="font-display text-3xl uppercase text-accent">
            {champion.name}
          </p>
        </div>
      )}
    </div>
  );
}
