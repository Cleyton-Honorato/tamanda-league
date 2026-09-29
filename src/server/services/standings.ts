import type { StandingRow } from '@/lib/types';

/** Um jogo já encerrado. Jogos agendados não entram no cálculo. */
export interface StandingsMatchInput {
  teamAId: string;
  teamBId: string;
  scoreA: number;
  scoreB: number;
}

/** Pontuação FIBA 3x3: quem vence soma 2, quem perde soma 1. */
const WIN_POINTS = 2;
const LOSS_POINTS = 1;

type Accumulator = Omit<StandingRow, 'position'>;

function emptyRow(teamId: string): Accumulator {
  return {
    teamId,
    played: 0,
    wins: 0,
    losses: 0,
    points: 0,
    scoreFor: 0,
    scoreAgainst: 0,
    scoreDiff: 0,
  };
}

/**
 * Desempate entre exatamente dois times: manda o confronto direto, como no
 * regulamento FIBA. Com três ou mais empatados a regra vira um mini-grupo e a
 * liga de bairro não precisa disso — cai para saldo.
 */
function headToHead(
  aId: string,
  bId: string,
  matches: StandingsMatchInput[],
): number {
  let aWins = 0;
  let bWins = 0;
  let aDiff = 0;

  for (const match of matches) {
    const involvesBoth =
      (match.teamAId === aId && match.teamBId === bId) ||
      (match.teamAId === bId && match.teamBId === aId);
    if (!involvesBoth) continue;

    const aIsHome = match.teamAId === aId;
    const aScore = aIsHome ? match.scoreA : match.scoreB;
    const bScore = aIsHome ? match.scoreB : match.scoreA;

    if (aScore > bScore) aWins += 1;
    else if (bScore > aScore) bWins += 1;
    aDiff += aScore - bScore;
  }

  if (aWins !== bWins) return bWins - aWins;
  return -aDiff;
}

function byOverallCriteria(a: Accumulator, b: Accumulator): number {
  if (a.scoreDiff !== b.scoreDiff) return b.scoreDiff - a.scoreDiff;
  if (a.scoreFor !== b.scoreFor) return b.scoreFor - a.scoreFor;
  // Último critério só para a ordem não variar entre renderizações.
  return a.teamId.localeCompare(b.teamId);
}

/**
 * Classificação de um grupo. Recebe os times do grupo e os jogos já encerrados;
 * times sem jogo aparecem zerados no fim da tabela.
 */
export function computeStandings(
  teamIds: string[],
  finished: StandingsMatchInput[],
): StandingRow[] {
  const table = new Map<string, Accumulator>();
  for (const teamId of teamIds) {
    table.set(teamId, emptyRow(teamId));
  }

  const relevant = finished.filter(
    (match) => table.has(match.teamAId) && table.has(match.teamBId),
  );

  for (const match of relevant) {
    const home = table.get(match.teamAId)!;
    const away = table.get(match.teamBId)!;

    home.played += 1;
    away.played += 1;
    home.scoreFor += match.scoreA;
    home.scoreAgainst += match.scoreB;
    away.scoreFor += match.scoreB;
    away.scoreAgainst += match.scoreA;

    const [winner, loser] =
      match.scoreA > match.scoreB ? [home, away] : [away, home];
    winner.wins += 1;
    winner.points += WIN_POINTS;
    loser.losses += 1;
    loser.points += LOSS_POINTS;
  }

  for (const row of table.values()) {
    row.scoreDiff = row.scoreFor - row.scoreAgainst;
  }

  const rows = [...table.values()].sort((a, b) => b.points - a.points);

  // Reordena cada bloco de empate em pontos com os critérios de desempate.
  const ordered: Accumulator[] = [];
  let index = 0;
  while (index < rows.length) {
    let end = index + 1;
    while (end < rows.length && rows[end].points === rows[index].points) {
      end += 1;
    }

    const tied = rows.slice(index, end);
    if (tied.length === 2) {
      tied.sort((a, b) => {
        const direct = headToHead(a.teamId, b.teamId, relevant);
        return direct !== 0 ? direct : byOverallCriteria(a, b);
      });
    } else if (tied.length > 2) {
      tied.sort(byOverallCriteria);
    }

    ordered.push(...tied);
    index = end;
  }

  return ordered.map((row, position) => ({ ...row, position: position + 1 }));
}
