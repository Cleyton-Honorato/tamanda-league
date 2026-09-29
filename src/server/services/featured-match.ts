import type { MatchDto } from '@/lib/types';

function startOfDayLocal(date: Date): number {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy.getTime();
}

/**
 * O "jogo do dia" da home. Prioridade: um jogo ainda por jogar hoje, senão o
 * próximo agendado, senão o último resultado — assim o card nunca fica vazio
 * depois que o campeonato começa.
 */
export function pickFeaturedMatch(
  matches: MatchDto[],
  now: Date,
): MatchDto | null {
  const dated = matches.filter(
    (match): match is MatchDto & { scheduledAt: string } =>
      match.scheduledAt !== null,
  );

  const scheduled = dated
    .filter((match) => match.status === 'SCHEDULED')
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));

  const dayStart = startOfDayLocal(now);
  const dayEnd = dayStart + 24 * 60 * 60 * 1000;

  const today = scheduled.find((match) => {
    const time = new Date(match.scheduledAt).getTime();
    return time >= dayStart && time < dayEnd;
  });
  if (today) return today;

  const upcoming = scheduled.find(
    (match) => new Date(match.scheduledAt).getTime() >= now.getTime(),
  );
  if (upcoming) return upcoming;

  const lastFinished = dated
    .filter((match) => match.status === 'FINISHED')
    .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))[0];

  return lastFinished ?? null;
}
