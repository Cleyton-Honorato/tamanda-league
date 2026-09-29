import { Clock } from 'lucide-react';
import { Card, accentForIndex } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { TeamCrest } from '@/components/brand/TeamCrest';
import { formatTime, formatDateTimeShort } from '@/lib/format';
import { STAGE_LABELS, type GroupDto, type MatchDto } from '@/lib/types';
import { cn } from '@/lib/cn';

/**
 * Card de jogo das listas públicas. Mostra horário quando está agendado e
 * placar quando encerrou, destacando o vencedor em verde.
 */
export function MatchCard({
  match,
  index,
  groups,
  showDate = false,
}: {
  match: MatchDto;
  index: number;
  groups: GroupDto[];
  showDate?: boolean;
}) {
  const finished = match.status === 'FINISHED';
  const aWins = finished && (match.scoreA ?? 0) > (match.scoreB ?? 0);
  const bWins = finished && (match.scoreB ?? 0) > (match.scoreA ?? 0);
  const group = groups.find((item) => item.id === match.groupId);

  const label =
    match.stage === 'GROUP'
      ? (group?.name ?? 'Fase de grupos')
      : `${STAGE_LABELS[match.stage]}${match.slot && match.stage !== 'F' ? ` · Jogo ${match.slot}` : ''}`;

  return (
    <Card accent={accentForIndex(index)} className="px-3 py-3">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="truncate font-display text-sm uppercase tracking-widest text-muted-foreground">
          {label}
        </span>

        {finished ? (
          <Badge tone="neutral">Encerrado</Badge>
        ) : match.scheduledAt ? (
          <Badge tone="green" icon={<Clock className="h-3.5 w-3.5" />}>
            {showDate
              ? formatDateTimeShort(match.scheduledAt)
              : formatTime(match.scheduledAt)}
          </Badge>
        ) : (
          <Badge tone="neutral">A definir</Badge>
        )}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <TeamCrest team={match.teamA} size="sm" accent="green" />
          <span
            className={cn(
              'min-w-0 truncate font-display text-lg uppercase leading-tight',
              aWins ? 'text-primary' : 'text-foreground',
            )}
          >
            {match.teamA?.name ?? 'A definir'}
          </span>
        </div>

        {finished ? (
          <span className="shrink-0 font-display text-2xl leading-none">
            <span className={aWins ? 'text-primary' : 'text-muted-foreground'}>
              {match.scoreA}
            </span>
            <span className="mx-1 text-muted-foreground">×</span>
            <span className={bWins ? 'text-primary' : 'text-muted-foreground'}>
              {match.scoreB}
            </span>
          </span>
        ) : (
          <span className="shrink-0 font-display text-base text-muted-foreground">
            VS
          </span>
        )}

        <div className="flex min-w-0 flex-row-reverse items-center gap-2">
          <TeamCrest team={match.teamB} size="sm" accent="orange" />
          <span
            className={cn(
              'min-w-0 truncate text-right font-display text-lg uppercase leading-tight',
              bWins ? 'text-primary' : 'text-foreground',
            )}
          >
            {match.teamB?.name ?? 'A definir'}
          </span>
        </div>
      </div>
    </Card>
  );
}
