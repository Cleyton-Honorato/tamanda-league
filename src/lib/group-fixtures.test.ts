import { describe, expect, it } from 'vitest';
import { groupFixtures } from './group-fixtures';

describe('groupFixtures', () => {
  it.each([4, 5, 6])('gera todos os confrontos uma vez com %i times', (size) => {
    const teams = Array.from({ length: size }, (_, index) => String(index + 1));
    const fixtures = groupFixtures(teams);
    expect(fixtures).toHaveLength(size * (size - 1) / 2);
    expect(new Set(fixtures.map(({ teamAId, teamBId }) => [teamAId, teamBId].sort().join('-'))).size).toBe(fixtures.length);
    for (const round of new Set(fixtures.map((fixture) => fixture.round))) {
      const playing = fixtures.filter((fixture) => fixture.round === round).flatMap((fixture) => [fixture.teamAId, fixture.teamBId]);
      expect(new Set(playing).size).toBe(playing.length);
    }
  });
});
