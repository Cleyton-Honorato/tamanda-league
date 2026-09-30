export interface DrawAthlete {
  id: string;
  name: string;
  level: number;
}

export interface DrawTeam {
  athletes: DrawAthlete[];
  totalLevel: number;
}

export interface DrawResult {
  teams: DrawTeam[];
  reserves: DrawAthlete[];
}

function seededRandom(seed: string) {
  let state = 2166136261;
  for (const char of seed) state = Math.imul(state ^ char.charCodeAt(0), 16777619);
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function score(teams: DrawAthlete[][]) {
  const totals = teams.map((team) => team.reduce((sum, athlete) => sum + athlete.level, 0));
  const average = totals.reduce((sum, total) => sum + total, 0) / teams.length;
  const topCounts = teams.map((team) => team.filter((athlete) => athlete.level === 5).length);
  const topAverage = topCounts.reduce((sum, count) => sum + count, 0) / teams.length;
  return totals.reduce((sum, total, index) =>
    sum + (total - average) ** 2 * 10 + (topCounts[index] - topAverage) ** 2 * 3, 0);
}

/** Embaralha dentro das faixas de nível, distribui em serpentina e melhora o equilíbrio por trocas. */
export function drawBalancedTeams(athletes: DrawAthlete[], seed: string): DrawResult {
  if (athletes.length < 4) throw new Error('São necessários ao menos quatro atletas.');
  if (athletes.some((athlete) => !Number.isInteger(athlete.level) || athlete.level < 1 || athlete.level > 5)) {
    throw new Error('Todos os atletas precisam ter nível de 1 a 5.');
  }

  const random = seededRandom(seed);
  const shuffled = [...athletes];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const target = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }

  const reserveCount = shuffled.length % 4;
  const reserves = shuffled.splice(0, reserveCount);
  const teamCount = shuffled.length / 4;
  shuffled.sort((a, b) => b.level - a.level);

  const teams = Array.from({ length: teamCount }, () => [] as DrawAthlete[]);
  shuffled.forEach((athlete, index) => {
    const round = Math.floor(index / teamCount);
    const slot = index % teamCount;
    teams[round % 2 === 0 ? slot : teamCount - 1 - slot].push(athlete);
  });

  let current = score(teams);
  for (let iteration = 0; iteration < 80; iteration++) {
    let best: { a: number; b: number; x: number; y: number; value: number } | null = null;
    for (let a = 0; a < teamCount; a++) {
      for (let b = a + 1; b < teamCount; b++) {
        for (let x = 0; x < 4; x++) {
          for (let y = 0; y < 4; y++) {
            if (teams[a][x].level === teams[b][y].level) continue;
            [teams[a][x], teams[b][y]] = [teams[b][y], teams[a][x]];
            const value = score(teams);
            [teams[a][x], teams[b][y]] = [teams[b][y], teams[a][x]];
            if (value < current - 0.001 && (!best || value < best.value)) best = { a, b, x, y, value };
          }
        }
      }
    }
    if (!best) break;
    [teams[best.a][best.x], teams[best.b][best.y]] = [teams[best.b][best.y], teams[best.a][best.x]];
    current = best.value;
  }

  return {
    teams: teams.map((team) => ({ athletes: team, totalLevel: team.reduce((sum, athlete) => sum + athlete.level, 0) })),
    reserves,
  };
}
