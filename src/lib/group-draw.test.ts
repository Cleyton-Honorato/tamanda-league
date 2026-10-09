import { describe, expect, it } from 'vitest';
import { drawGroups } from './group-draw';

const teams = Array.from({ length: 11 }, (_, index) => ({
  id: `team-${index}`,
  strength: 9 + (index % 5),
  groupId: index < 5 ? 'green' : 'orange',
}));

describe('drawGroups', () => {
  it('preserva os times, distribui 5/6 e equilibra as médias', () => {
    const result = drawGroups(teams, ['green', 'orange'], 'season-1');
    expect(result.size).toBe(11);
    const green = teams.filter((team) => result.get(team.id) === 'green');
    const orange = teams.filter((team) => result.get(team.id) === 'orange');
    expect([green.length, orange.length].sort()).toEqual([5, 6]);
    const average = (entries: typeof teams) => entries.reduce((sum, team) => sum + team.strength, 0) / entries.length;
    expect(Math.abs(average(green) - average(orange))).toBeLessThan(0.5);
    expect(drawGroups(teams, ['green', 'orange'], 'season-1')).toEqual(result);
    expect(teams.some((team) => result.get(team.id) !== team.groupId)).toBe(true);
  });
});
