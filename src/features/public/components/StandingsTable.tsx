import { TeamCrest } from '@/components/brand/TeamCrest';
import { cn } from '@/lib/cn';
import type { StandingRow, TeamRefDto } from '@/lib/types';

/**
 * Tabela do grupo. As duas primeiras posições levam destaque verde — é o corte
 * usual para o mata-mata num grupo de quatro.
 */
export function StandingsTable({
  rows,
  teamsById,
  qualifyingSpots = 2,
}: {
  rows: StandingRow[];
  teamsById: Map<string, TeamRefDto>;
  qualifyingSpots?: number;
}) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-elevated font-display uppercase tracking-wider text-muted-foreground">
            <th className="w-8 py-2 text-center font-normal">#</th>
            <th className="py-2 pl-1 text-left font-normal">Time</th>
            <th className="w-8 py-2 text-center font-normal">J</th>
            <th className="w-8 py-2 text-center font-normal">V</th>
            <th className="w-8 py-2 text-center font-normal">D</th>
            <th className="w-10 py-2 text-center font-normal">+/−</th>
            <th className="w-10 py-2 text-center font-normal text-primary">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const team = teamsById.get(row.teamId);
            const qualified = row.position <= qualifyingSpots;

            return (
              <tr
                key={row.teamId}
                className={cn(
                  'border-t border-border bg-surface',
                  qualified && 'bg-primary/[0.06]',
                )}
              >
                <td className="py-2.5 text-center">
                  <span
                    className={cn(
                      'inline-block w-5 rounded-sm font-display text-base leading-tight',
                      qualified ? 'text-primary' : 'text-muted-foreground',
                    )}
                  >
                    {row.position}
                  </span>
                </td>

                <td className="py-2.5 pl-1">
                  <div className="flex items-center gap-2">
                    <TeamCrest
                      team={team ?? null}
                      size="sm"
                      accent={qualified ? 'green' : 'orange'}
                    />
                    <span className="min-w-0 truncate font-display text-base uppercase leading-tight">
                      <span className="sm:hidden">{team?.shortName ?? '—'}</span>
                      <span className="hidden sm:inline">{team?.name ?? '—'}</span>
                    </span>
                  </div>
                </td>

                <td className="py-2.5 text-center text-muted-foreground">
                  {row.played}
                </td>
                <td className="py-2.5 text-center">{row.wins}</td>
                <td className="py-2.5 text-center text-muted-foreground">
                  {row.losses}
                </td>
                <td
                  className={cn(
                    'py-2.5 text-center',
                    row.scoreDiff > 0
                      ? 'text-primary'
                      : row.scoreDiff < 0
                        ? 'text-accent'
                        : 'text-muted-foreground',
                  )}
                >
                  {row.scoreDiff > 0 ? `+${row.scoreDiff}` : row.scoreDiff}
                </td>
                <td className="py-2.5 text-center font-display text-lg leading-none text-primary">
                  {row.points}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
