import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Types } from 'mongoose';

const mocks = vi.hoisted(() => ({
  connect: vi.fn(), transactions: vi.fn(),
  groups: vi.fn(), teams: vi.fn(), athletes: vi.fn(), matches: vi.fn(), knockoutCount: vi.fn(),
  teamWrite: vi.fn(), matchDelete: vi.fn(), matchInsert: vi.fn(),
  lockAcquire: vi.fn(), lockDelete: vi.fn(),
}));
vi.mock('@/server/db', () => ({ dbConnect: mocks.connect }));
vi.mock('@/server/db-capabilities', () => ({ databaseSupportsTransactions: mocks.transactions }));
vi.mock('@/server/models/group', () => ({ Group: { find: mocks.groups } }));
vi.mock('@/server/models/team', () => ({ Team: { find: mocks.teams, bulkWrite: mocks.teamWrite } }));
vi.mock('@/server/models/athlete', () => ({ Athlete: { find: mocks.athletes } }));
vi.mock('@/server/models/match', () => ({ Match: {
  find: mocks.matches, countDocuments: mocks.knockoutCount,
  deleteMany: mocks.matchDelete, insertMany: mocks.matchInsert,
} }));

import { commitGroupDraw, previewGroupDraw } from './group-draw';

const groups = ['Verde', 'Laranja'].map((name, order) => ({ _id: new Types.ObjectId(), name, order }));
const teams = Array.from({ length: 4 }, (_, index) => ({
  _id: new Types.ObjectId(), name: `Time ${index + 1}`, shortName: `T${index + 1}`,
  groupId: groups[index < 2 ? 0 : 1]._id,
}));
const athletes = teams.flatMap((team) => Array.from({ length: 4 }, () => ({
  teamId: team._id, level: 2.5,
})));
const emptyFixtures = groups.map((group, index) => ({
  _id: new Types.ObjectId(), stage: 'GROUP', groupId: group._id, round: 1,
  teamAId: teams[index * 2]._id, teamBId: teams[index * 2 + 1]._id,
  status: 'SCHEDULED', scheduledAt: null, live: null, scoreA: null, scoreB: null,
  updatedAt: new Date('2026-10-08T12:00:00Z'),
}));

const sorted = (value: unknown) => ({ sort: () => ({ session: () => ({ lean: async () => value }) }) });
const selected = (value: unknown) => ({ select: () => ({ session: () => ({ lean: async () => value }) }) });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.groups.mockReturnValue(sorted(groups));
  mocks.teams.mockReturnValue(sorted(teams));
  mocks.athletes.mockReturnValue(selected(athletes));
  mocks.matches.mockReturnValue(sorted([]));
  mocks.knockoutCount.mockReturnValue({ session: async () => 0 });
  mocks.transactions.mockResolvedValue(true);
  mocks.connect.mockResolvedValue({
    startSession: async () => ({ withTransaction: async (fn: () => unknown) => fn(), endSession: async () => {} }),
    connection: { db: { collection: () => ({ findOneAndUpdate: mocks.lockAcquire, deleteOne: mocks.lockDelete }) } },
  });
  mocks.lockAcquire.mockResolvedValue(null);
  mocks.lockDelete.mockResolvedValue({ deletedCount: 1 });
  mocks.teamWrite.mockResolvedValue({ modifiedCount: 4 });
  mocks.matchDelete.mockResolvedValue({ deletedCount: 0 });
  mocks.matchInsert.mockResolvedValue([]);
});

describe('sorteio das conferências', () => {
  it('mostra a prévia sem gravar e confirma os grupos com novos confrontos', async () => {
    const preview = await previewGroupDraw();
    expect(preview.groups.map((group) => group.teams.length)).toEqual([2, 2]);
    expect(mocks.teamWrite).not.toHaveBeenCalled();
    expect(mocks.matchInsert).not.toHaveBeenCalled();

    const result = await commitGroupDraw(preview.seed, preview.fingerprint);
    expect(result).toEqual({ teamCount: 4, fixtureCount: 2 });
    expect(mocks.teamWrite).toHaveBeenCalledOnce();
    expect(mocks.matchInsert).toHaveBeenCalledOnce();
    const fixtures = mocks.matchInsert.mock.calls[0][0] as Array<{ groupId: Types.ObjectId; teamAId: Types.ObjectId; teamBId: Types.ObjectId }>;
    const assignments = new Map(preview.groups.flatMap((group) => group.teams.map((team) => [team.id, group.id])));
    expect(fixtures.every((fixture) => assignments.get(fixture.teamAId.toString()) === fixture.groupId.toString()
      && assignments.get(fixture.teamBId.toString()) === fixture.groupId.toString())).toBe(true);
  });

  it('protege partida agendada antes de mostrar a prévia', async () => {
    mocks.matches.mockReturnValue(sorted([{ status: 'SCHEDULED', scheduledAt: new Date(), live: null, scoreA: null, scoreB: null, round: 1 }]));
    await expect(previewGroupDraw()).rejects.toThrow('Há jogos agendados');
    expect(mocks.teamWrite).not.toHaveBeenCalled();
  });

  it('confirma no Mongo local sem transações', async () => {
    const preview = await previewGroupDraw();
    mocks.transactions.mockResolvedValue(false);
    await expect(commitGroupDraw(preview.seed, preview.fingerprint)).resolves.toEqual({ teamCount: 4, fixtureCount: 2 });
    expect(mocks.lockAcquire).toHaveBeenCalledOnce();
    expect(mocks.lockDelete).toHaveBeenCalledOnce();
    expect(mocks.matchInsert).toHaveBeenCalledOnce();
  });

  it('reorganiza confrontos sem data junto com os times no Mongo local', async () => {
    mocks.matches.mockReturnValue(sorted(emptyFixtures));
    const preview = await previewGroupDraw();
    expect(preview.replacedFixtures).toBe(2);
    mocks.transactions.mockResolvedValue(false);
    await expect(commitGroupDraw(preview.seed, preview.fingerprint)).resolves.toEqual({ teamCount: 4, fixtureCount: 2 });
    expect(mocks.matchDelete).toHaveBeenCalledOnce();
    expect(mocks.matchInsert).toHaveBeenCalledOnce();
  });

  it('restaura os grupos e confrontos anteriores se a gravação local falhar', async () => {
    mocks.matches.mockReturnValue(sorted(emptyFixtures));
    const preview = await previewGroupDraw();
    mocks.transactions.mockResolvedValue(false);
    mocks.matchInsert.mockRejectedValueOnce(new Error('write failed')).mockResolvedValueOnce([]);
    await expect(commitGroupDraw(preview.seed, preview.fingerprint)).rejects.toThrow('write failed');
    expect(mocks.teamWrite).toHaveBeenCalledTimes(2);
    expect(mocks.matchInsert).toHaveBeenCalledTimes(2);
    expect(mocks.lockDelete).toHaveBeenCalledOnce();
  });
});
