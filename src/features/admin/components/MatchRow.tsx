import type { ReactNode } from 'react';
import { CalendarClock } from 'lucide-react';
import { Card, accentForIndex } from '@/components/ui/Card';
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
}: {
  team: MatchDto['teamA'];
  score: number | null;
  isWinner: boolean;
  align?: 'left' | 'right';
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-1 items-center gap-2',
        align === 'right' && 'flex-row-reverse',
      )}
    >
      <TeamCrest team={team} size="sm" accent={align === 'left' ? 'green' : 'orange'} />
      <span
        className={cn(
          'min-w-0 truncate font-display text-lg uppercase leading-tight',
          isWinner ? 'text-primary' : 'text-foreground',
        )}
      >
        {team?.name ?? 'A definir'}
      </span>
      {score !== null && (
        <span
          className={cn(
            'ml-auto font-display text-2xl leading-none',
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
}: {
  match: MatchDto;
  index: number;
  groups: GroupDto[];
  actions?: ReactNode;
  readOnly?: boolean;
}) {
  const finished = match.status === 'FINISHED';
  const aWins = finished && (match.scoreA ?? 0) > (match.scoreB ?? 0);
  const bWins = finished && (match.scoreB ?? 0) > (match.scoreA ?? 0);
  const group = groups.find((item) => item.id === match.groupId);

  return (
    <Card accent={accentForIndex(index)} className="p-3">
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
        <TeamSide team={match.teamA} score={match.scoreA} isWinner={aWins} />
        <span className="shrink-0 font-display text-sm text-muted-foreground">
          VS
        </span>
        <TeamSide
          team={match.teamB}
          score={match.scoreB}
          isWinner={bWins}
          align="right"
        />
      </div>

      {!readOnly && actions && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
          {actions}
        </div>
      )}
    </Card>
  );
}
