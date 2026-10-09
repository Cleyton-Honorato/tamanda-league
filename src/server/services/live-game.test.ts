import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ findById: vi.fn(), update: vi.fn(), athletes: vi.fn() }));
vi.mock('@/server/db', () => ({ dbConnect: vi.fn() }));
vi.mock('@/server/models/match', () => ({ Match: { findById: mocks.findById, findOneAndUpdate: mocks.update } }));
vi.mock('@/server/models/athlete', () => ({ Athlete: { find: mocks.athletes } }));
import { changeLiveGame } from './live-game';
const players = Array.from({ length: 8 }, (_, index) => ({ id: String(index), name: `Jogador ${index}`, team: index < 4 ? 'A' : 'B' }));
const match = { __v: 4, status: 'SCHEDULED', teamAId: 'team-a', teamBId: 'team-b', live: { players, baskets: [], remainingMs: 600000, startedAt: null } };
beforeEach(() => {
  vi.clearAllMocks();
  mocks.findById.mockReturnValue({ lean: async () => structuredClone(match) });
  mocks.update.mockResolvedValue({});
});
describe('persistent game desk', () => {
  it('uses the roster snapshot and an atomic version check when saving points', async () => {
    const result = await changeLiveGame('match-id', 4, { type: 'score', playerId: '0', points: 2, eventId: 'event-1' });
    expect(result.version).toBe(5);
    expect(result.game.baskets[0].points).toBe(2);
    expect(mocks.athletes).not.toHaveBeenCalled();
    expect(mocks.update.mock.calls[0][0]).toMatchObject({ __v: 4, status: 'SCHEDULED', teamAId: 'team-a', teamBId: 'team-b' });
    expect(mocks.update.mock.calls[0][1].$inc).toEqual({ __v: 1 });
  });
  it('rejects stale clients before writing', async () => {
    await expect(changeLiveGame('match-id', 3, { type: 'start' })).rejects.toThrow('outra aba');
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it('reports a concurrent write that happens after the read', async () => {
    mocks.update.mockResolvedValue(null);
    await expect(changeLiveGame('match-id', 4, { type: 'start' })).rejects.toThrow('mesa mudou');
  });
  it('rejects writes to finished games and invalid rosters', async () => {
    mocks.findById.mockReturnValue({ lean: async () => ({ ...match, status: 'FINISHED' }) });
    await expect(changeLiveGame('match-id', 4, { type: 'start' })).rejects.toThrow('encerrado');
    mocks.findById.mockReturnValue({ lean: async () => ({ ...match, live: { ...match.live, players: players.slice(1) } }) });
    await expect(changeLiveGame('match-id', 4, { type: 'start' })).rejects.toThrow('quatro atletas');
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
