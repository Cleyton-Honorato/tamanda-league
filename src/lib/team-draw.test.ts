import { describe, expect, it } from 'vitest';
import { drawBalancedTeams } from './team-draw';

const athletes = Array.from({ length: 45 }, (_, index) => ({
  id: String(index),
  name: `Atleta ${index}`,
  level: (index % 5) + 1,
}));

describe('drawBalancedTeams', () => {
  it('forms only complete 3x3 rosters, preserves everyone and balances the levels', () => {
    const result = drawBalancedTeams(athletes, 'season-seed');
    const ids = [...result.reserves, ...result.teams.flatMap((team) => team.athletes)].map((athlete) => athlete.id);
    expect(result.teams).toHaveLength(11);
    expect(result.teams.every((team) => team.athletes.length === 4)).toBe(true);
    expect(result.reserves).toHaveLength(1);
    expect(new Set(ids).size).toBe(45);
    const levels = result.teams.map((team) => team.totalLevel);
    expect(Math.max(...levels) - Math.min(...levels)).toBeLessThanOrEqual(2);
    expect(drawBalancedTeams(athletes, 'season-seed')).toEqual(result);
  });

  it('refuses unrated athletes', () => {
    expect(() => drawBalancedTeams([{ id: 'a', name: 'A', level: 0 }, ...athletes], 'seed')).toThrow();
  });
});
