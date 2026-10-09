import type { ReactNode } from 'react';
import Link from 'next/link';
import { CalendarClock, Timer } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { TeamCrest } from '@/components/brand/TeamCrest';
import { formatDateTimeShort } from '@/lib/format';
import { STAGE_LABELS, type GroupDto, type MatchDto } from '@/lib/types';
import { cn } from '@/lib/cn';

function TeamSide({
  team,
  score,
  isWinner,
  align = 'left',
  compact = false,
  accent,
}: {
  team: MatchDto['teamA'];
  score: number | null;
  isWinner: boolean;
  align?: 'left' | 'right';
  compact?: boolean;
  accent: 'green' | 'orange';
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-1 items-center gap-2',
        align === 'right' && 'flex-row-reverse',
      )}
    >
      <TeamCrest team={team} size="sm" accent={accent} />
      <span
        className={cn(
        'min-w-0 truncate font-display uppercase leading-tight',
        compact ? 'text-sm sm:text-base' : 'text-lg',
          isWinner ? 'text-primary' : 'text-foreground',
        )}
      >
        {team?.name ?? 'A definir'}
      </span>
      {score !== null && (
        <span
          className={cn(
            'ml-auto font-display leading-none',
            compact ? 'text-xl' : 'text-2xl',
            align === 'right' && 'ml-0 mr-auto',
            isWinner ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          {score}
        </span>
      )}
    </div>
  );
}

export function MatchRow({
  match,
  index,
  groups,
  actions,
  readOnly,
  compact = false,
}: {
  match: MatchDto;
  index: number;
  groups: GroupDto[];
  actions?: ReactNode;
  readOnly?: boolean;
  compact?: boolean;
}) {
  const finished = match.status === 'FINISHED';
  const aWins = finished && (match.scoreA ?? 0) > (match.scoreB ?? 0);
  const bWins = finished && (match.scoreB ?? 0) > (match.scoreA ?? 0);
  const group = groups.find((item) => item.id === match.groupId);
  const accent = match.stage === 'GROUP' ? (group?.name.toLowerCase().includes('laranja') ? 'orange' : 'green') : index % 2 === 0 ? 'green' : 'orange';

  return (
    <Card accent={accent} className={compact ? 'h-full p-3' : 'p-3'}>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Badge tone={match.stage === 'GROUP' ? 'neutral' : 'orange'}>
          {match.stage === 'GROUP'
            ? (group?.name ?? 'Grupo')
            : `${STAGE_LABELS[match.stage]}${match.slot ? ` ${match.slot}` : ''}`}
        </Badge>

        {match.scheduledAt ? (
          <Badge tone="green" icon={<CalendarClock className="h-3.5 w-3.5" />}>
            {formatDateTimeShort(match.scheduledAt)}
          </Badge>
        ) : (
          <Badge tone="neutral">Data a definir</Badge>
        )}

        {finished && <Badge tone="neutral">Encerrado</Badge>}
      </div>

      <div className="flex items-center gap-2">
        <TeamSide team={match.teamA} score={match.scoreA} isWinner={aWins} compact={compact} accent={accent} />
        <span className="shrink-0 font-display text-sm text-muted-foreground">
          VS
        </span>
        <TeamSide
          team={match.teamB}
          score={match.scoreB}
          isWinner={bWins}
          align="right"
          compact={compact}
          accent={accent}
        />
      </div>

      {!readOnly && actions && (
        <div className={cn('flex flex-wrap items-center gap-2 border-t border-border', compact ? 'mt-2 pt-2' : 'mt-3 pt-3')}>
          {match.teamA && match.teamB && <Link href={`/admin/jogos/${match.id}/mesa`} aria-label="Abrir mesa de jogo" title="Mesa de jogo" className={cn('inline-flex h-9 items-center justify-center rounded-lg border border-primary/40 font-display text-sm uppercase text-primary hover:bg-primary/10', compact ? 'w-9' : 'px-3')}>{compact ? <Timer className="h-4 w-4" /> : 'Mesa de jogo'}</Link>}
          {actions}
        </div>
      )}
    </Card>
  );
}
