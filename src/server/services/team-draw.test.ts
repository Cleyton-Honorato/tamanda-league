import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  transactions: vi.fn(), connect: vi.fn(), findAthletes: vi.fn(), findGroups: vi.fn(),
  countTeams: vi.fn(), insertTeams: vi.fn(), deleteTeams: vi.fn(),
  writeAthletes: vi.fn(), updateAthletes: vi.fn(), countAthletes: vi.fn(),
  lockAcquire: vi.fn(), lockUpdate: vi.fn(), lockDelete: vi.fn(), matchExists: vi.fn(),
}));
vi.mock('@/server/db-capabilities', () => ({ databaseSupportsTransactions: mocks.transactions }));
vi.mock('@/server/db', () => ({ dbConnect: mocks.connect }));
vi.mock('@/server/models/athlete', () => ({ Athlete: {
  find: mocks.findAthletes, bulkWrite: mocks.writeAthletes,
  updateMany: mocks.updateAthletes, countDocuments: mocks.countAthletes,
} }));
vi.mock('@/server/models/group', () => ({ Group: { find: mocks.findGroups } }));
vi.mock('@/server/models/team', () => ({ Team: {
  countDocuments: mocks.countTeams, insertMany: mocks.insertTeams, deleteMany: mocks.deleteTeams,
} }));
vi.mock('@/server/models/match', () => ({ Match: { exists: mocks.matchExists } }));

import { commitTeamDraw, previewTeamDraw } from './team-draw';

const query = <T>(value: T) => ({ sort: () => ({ session: () => ({ lean: async () => value }) }) });
const athletes = Array.from({ length: 8 }, (_, index) => ({
  _id: { toString: () => (index + 1).toString(16).padStart(24, '0') },
  name: `Atleta ${index}`, level: (index % 5) + 1, teamId: null,
}));
const groups = [0, 1].map((index) => ({ _id: { toString: () => (index + 20).toString(16).padStart(24, '0') } }));

beforeEach(() => {
  vi.clearAllMocks();
  const lock = { findOneAndUpdate: mocks.lockAcquire, updateOne: mocks.lockUpdate, deleteOne: mocks.lockDelete };
  mocks.connect.mockResolvedValue({ connection: { db: { collection: () => lock } } });
  mocks.transactions.mockResolvedValue(false);
  mocks.findAthletes.mockReturnValue(query(athletes));
  mocks.findGroups.mockReturnValue(query(groups));
  mocks.countTeams.mockReturnValue({ session: async () => 0 });
  mocks.countAthletes.mockResolvedValue(0);
  mocks.lockAcquire.mockResolvedValue(null);
  mocks.lockUpdate.mockResolvedValue({ matchedCount: 1 });
  mocks.lockDelete.mockResolvedValue({ deletedCount: 1 });
  mocks.insertTeams.mockImplementation(async (teams: Array<{ _id: unknown }>) => teams);
  mocks.writeAthletes.mockResolvedValue({ modifiedCount: 8 });
  mocks.updateAthletes.mockResolvedValue({ modifiedCount: 8 });
  mocks.deleteTeams.mockResolvedValue({ deletedCount: 2 });
  mocks.matchExists.mockResolvedValue(null);
});

describe('confirmação do sorteio', () => {
  it('confirma em Mongo standalone sem abrir transação e preserva 4 atletas por time', async () => {
    const preview = await previewTeamDraw();
    const result = await commitTeamDraw(preview.seed, preview.fingerprint);
    expect(result).toEqual({ teamCount: 2, reserveCount: 0 });
    expect(mocks.insertTeams).toHaveBeenCalledOnce();
    expect(mocks.insertTeams.mock.calls[0][0].every((team: { groupId: unknown }) => team.groupId === null)).toBe(true);
    expect(mocks.writeAthletes.mock.calls[0][0]).toHaveLength(8);
    expect(mocks.lockUpdate.mock.calls.at(-1)?.[1]).toMatchObject({ $set: { status: 'complete' } });
    expect(mocks.lockDelete).toHaveBeenCalledOnce();
    expect(mocks.deleteTeams).not.toHaveBeenCalled();
  });

  it('desfaz somente os times desta tentativa quando a associação falha', async () => {
    const preview = await previewTeamDraw();
    mocks.writeAthletes.mockRejectedValue(new Error('write failed'));
    await expect(commitTeamDraw(preview.seed, preview.fingerprint)).rejects.toThrow('write failed');
    expect(mocks.updateAthletes).toHaveBeenCalledOnce();
    expect(mocks.deleteTeams).toHaveBeenCalledOnce();
    expect(mocks.lockDelete).toHaveBeenCalledOnce();
  });

  it('bloqueia uma segunda confirmação simultânea com mensagem clara', async () => {
    const preview = await previewTeamDraw();
    mocks.lockAcquire.mockRejectedValue({ code: 11000 });
    await expect(commitTeamDraw(preview.seed, preview.fingerprint)).rejects.toThrow('Outro sorteio');
    expect(mocks.insertTeams).not.toHaveBeenCalled();
  });

  it('mantém transação no replica set de produção', async () => {
    const preview = await previewTeamDraw();
    mocks.transactions.mockResolvedValue(true);
    const endSession = vi.fn();
    mocks.connect.mockResolvedValue({ startSession: async () => ({ withTransaction: async (fn: () => unknown) => fn(), endSession }) });
    await expect(commitTeamDraw(preview.seed, preview.fingerprint)).resolves.toEqual({ teamCount: 2, reserveCount: 0 });
    expect(endSession).toHaveBeenCalledOnce();
    expect(mocks.lockAcquire).not.toHaveBeenCalled();
  });
});
