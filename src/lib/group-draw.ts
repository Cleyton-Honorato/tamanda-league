export interface GroupDrawTeam {
  id: string;
  strength: number;
  groupId: string | null;
}

function randomFromSeed(seed: string) {
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

/** Sorteia duas chaves com tamanhos próximos e médias de estrelas equilibradas. */
export function drawGroups(teams: GroupDrawTeam[], groupIds: [string, string], seed: string): Map<string, string> {
  if (teams.length < 4) throw new Error('São necessários ao menos quatro times para sortear os grupos.');
  if (new Set(teams.map((team) => team.id)).size !== teams.length) throw new Error('Há times repetidos no sorteio.');
  if (groupIds[0] === groupIds[1]) throw new Error('Os dois grupos precisam ser diferentes.');

  const random = randomFromSeed(seed);
  let best: { assignment: Map<string, string>; score: number } | null = null;

  for (let attempt = 0; attempt < 600; attempt++) {
    const shuffled = [...teams];
    for (let index = shuffled.length - 1; index > 0; index--) {
      const target = Math.floor(random() * (index + 1));
      [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
    }

    const firstSize = Math.floor(teams.length / 2) + (teams.length % 2 && random() < 0.5 ? 1 : 0);
    const first = shuffled.slice(0, firstSize);
    const second = shuffled.slice(firstSize);
    const assignment = new Map(shuffled.map((team, index) => [team.id, groupIds[index < firstSize ? 0 : 1]]));
    const unchanged = teams.every((team) => team.groupId === assignment.get(team.id));
    if (unchanged) continue;

    const firstAverage = first.reduce((sum, team) => sum + team.strength, 0) / first.length;
    const secondAverage = second.reduce((sum, team) => sum + team.strength, 0) / second.length;
    // O desempate mantém o sorteio variado quando várias combinações têm força igual.
    const score = Math.abs(firstAverage - secondAverage) + random() * 0.12;
    if (!best || score < best.score) best = { assignment, score };
  }

  if (!best) throw new Error('Não foi possível formar dois grupos diferentes.');
  return best.assignment;
}
