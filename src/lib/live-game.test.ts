import { describe, expect, it } from 'vitest';
import { applyGameCommand, gameTotals, remainingTime, type LiveGame } from './live-game';
const initial: LiveGame = { players: [{ id: 'a', name: 'A', team: 'A' }, { id: 'b', name: 'B', team: 'B' }], baskets: [], remainingMs: 600000, startedAt: null };
describe('mesa de jogo', () => {
  it('attributes points to players, totals their teams and undoes a basket without negative scores', () => {
    let game = applyGameCommand(initial, { type: 'score', playerId: 'a', points: 2, eventId: '1' }, 1000);
    game = applyGameCommand(game, { type: 'score', playerId: 'b', points: 1, eventId: '2' }, 2000);
    expect(gameTotals(game)).toEqual({ A: 2, B: 1 });
    game = applyGameCommand(game, { type: 'undo', eventId: '1' }, 3000);
    expect(gameTotals(game)).toEqual({ A: 0, B: 1 });
    expect(() => applyGameCommand(game, { type: 'undo', eventId: '1' }, 4000)).toThrow();
    expect(initial.baskets).toHaveLength(0);
  });
  it('does not double-count a retried event and rejects players outside the roster', () => {
    const command = { type: 'score', playerId: 'a', points: 2, eventId: '1' } as const;
    const game = applyGameCommand(initial, command, 0);
    expect(applyGameCommand(game, command, 10).baskets).toHaveLength(1);
    expect(() => applyGameCommand(initial, { ...command, playerId: 'outside' }, 0)).toThrow();
  });
  it('restores elapsed time, pauses, resumes and stops at zero', () => {
    let game = applyGameCommand(initial, { type: 'start' }, 1000);
    expect(remainingTime(JSON.parse(JSON.stringify(game)), 11000)).toBe(590000);
    expect(() => applyGameCommand(game, { type: 'clock', seconds: 50 }, 11000)).toThrow();
    game = applyGameCommand(game, { type: 'pause' }, 11000);
    expect(remainingTime(game, 91000)).toBe(590000);
    game = applyGameCommand(game, { type: 'start' }, 91000);
    expect(remainingTime(game, 1000000)).toBe(0);
    game = applyGameCommand(game, { type: 'clock', seconds: 120 }, 1000000);
    expect(game.remainingMs).toBe(120000);
    expect(game.startedAt).toBeNull();
  });
});
