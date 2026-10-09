/** Todos contra todos, em turno único. Com número ímpar, um time folga por rodada. */
export function groupFixtures(teamIds: string[]): { round: number; teamAId: string; teamBId: string }[] {
  const rotation: (string | null)[] = [...teamIds];
  if (rotation.length % 2) rotation.push(null);
  const fixtures: { round: number; teamAId: string; teamBId: string }[] = [];
  for (let round = 1; round < rotation.length; round++) {
    for (let position = 0; position < rotation.length / 2; position++) {
      const a = rotation[position];
      const b = rotation[rotation.length - 1 - position];
      if (a && b) fixtures.push({ round, teamAId: round % 2 ? a : b, teamBId: round % 2 ? b : a });
    }
    rotation.splice(1, 0, rotation.pop()!);
  }
  return fixtures;
}
