import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { Types, type ClientSession } from 'mongoose';
import { dbConnect } from '@/server/db';
import { databaseSupportsTransactions } from '@/server/db-capabilities';
import { DomainError } from '@/server/errors';
import { Athlete } from '@/server/models/athlete';
import { Group } from '@/server/models/group';
import { Match } from '@/server/models/match';
import { Team } from '@/server/models/team';
import { drawGroups } from '@/lib/group-draw';
import { groupFixtures } from '@/lib/group-fixtures';

export interface GroupDrawPreview {
  seed: string;
  fingerprint: string;
  replacedFixtures: number;
  groups: {
    id: string;
    name: string;
    teams: { id: string; name: string; shortName: string; strength: number; moved: boolean }[];
    averageStrength: number;
  }[];
}

async function loadContext(session?: ClientSession) {
  const [groups, teams, athletes, groupMatches, knockoutCount] = await Promise.all([
    Group.find().sort({ order: 1, name: 1 }).session(session ?? null).lean(),
    Team.find().sort({ name: 1 }).session(session ?? null).lean(),
    Athlete.find().select('teamId level').session(session ?? null).lean(),
    Match.find({ stage: 'GROUP' }).sort({ _id: 1 }).session(session ?? null).lean(),
    Match.countDocuments({ stage: { $ne: 'GROUP' } }).session(session ?? null),
  ]);

  if (groups.length !== 2) throw new DomainError('Cadastre duas conferências antes de sortear os grupos.');
  if (teams.length < 4) throw new DomainError('Forme ao menos quatro times antes de sortear os grupos.');
  if (knockoutCount > 0) throw new DomainError('O mata-mata já foi iniciado. O sorteio dos grupos está encerrado.');
  const gameHasActivity = (live: typeof groupMatches[number]['live']) =>
    live && (live.startedAt !== null || live.baskets.length > 0 || live.remainingMs !== 600_000);
  if (groupMatches.some((match) => match.status !== 'SCHEDULED' || match.scheduledAt || gameHasActivity(match.live) || match.scoreA !== null || match.scoreB !== null || match.round === null)) {
    throw new DomainError('Há jogos agendados, iniciados ou editados. Revise esses jogos antes de sortear novamente.');
  }

  const groupIds = new Set(groups.map((group) => group._id.toString()));
  if (teams.some((team) => team.groupId && !groupIds.has(team.groupId.toString()))) {
    throw new DomainError('Há time associado a uma conferência que não existe mais. Ajuste os times antes do sorteio.');
  }
  const roster = new Map<string, number[]>();
  for (const athlete of athletes) {
    if (!athlete.teamId) continue;
    const id = athlete.teamId.toString();
    roster.set(id, [...(roster.get(id) ?? []), athlete.level ?? 0]);
  }
  if (teams.some((team) => (roster.get(team._id.toString()) ?? []).length !== 4 || (roster.get(team._id.toString()) ?? []).some((level) => level < 0.5))) {
    throw new DomainError('Cada time precisa ter quatro atletas avaliados antes do sorteio.');
  }

  if (groupMatches.length > 0) {
    const expected = groups.reduce((count, group) => {
      const members = teams.filter((team) => team.groupId?.equals(group._id)).length;
      return count + members * (members - 1) / 2;
    }, 0);
    if (groupMatches.length !== expected) {
      throw new DomainError('A tabela atual foi alterada manualmente. Revise os confrontos antes de sortear novamente.');
    }
  }

  const strengths = new Map(teams.map((team) => [team._id.toString(), (roster.get(team._id.toString()) ?? []).reduce((sum, level) => sum + level, 0)]));
  const fingerprint = createHash('sha256').update(JSON.stringify({
    groups: groups.map((group) => [group._id.toString(), group.name, group.order]),
    teams: teams.map((team) => [team._id.toString(), team.name, team.groupId?.toString() ?? null, strengths.get(team._id.toString())]),
    matches: groupMatches.map((match) => [match._id.toString(), match.updatedAt?.toISOString()]),
  })).digest('hex');

  return { groups, teams, groupMatches, strengths, fingerprint };
}

function makePreview(context: Awaited<ReturnType<typeof loadContext>>, seed: string): GroupDrawPreview {
  const ids = context.groups.map((group) => group._id.toString()) as [string, string];
  const assignment = drawGroups(context.teams.map((team) => ({
    id: team._id.toString(),
    strength: context.strengths.get(team._id.toString()) ?? 0,
    groupId: team.groupId?.toString() ?? null,
  })), ids, seed);

  return {
    seed,
    fingerprint: context.fingerprint,
    replacedFixtures: context.groupMatches.length,
    groups: context.groups.map((group) => {
      const members = context.teams.filter((team) => assignment.get(team._id.toString()) === group._id.toString());
      return {
        id: group._id.toString(),
        name: group.name,
        teams: members.map((team) => ({
          id: team._id.toString(),
          name: team.name,
          shortName: team.shortName,
          strength: context.strengths.get(team._id.toString()) ?? 0,
          moved: team.groupId?.toString() !== group._id.toString(),
        })),
        averageStrength: members.reduce((sum, team) => sum + (context.strengths.get(team._id.toString()) ?? 0), 0) / members.length,
      };
    }),
  };
}

function fixturesFor(preview: GroupDrawPreview) {
  return preview.groups.flatMap((group) => groupFixtures(group.teams.map((team) => team.id)).map((fixture) => ({
    _id: new Types.ObjectId(),
    stage: 'GROUP' as const,
    groupId: new Types.ObjectId(group.id),
    round: fixture.round,
    slot: null,
    teamAId: new Types.ObjectId(fixture.teamAId),
    teamBId: new Types.ObjectId(fixture.teamBId),
    scheduledAt: null,
    status: 'SCHEDULED' as const,
    scoreA: null,
    scoreB: null,
    live: null,
  })));
}

export async function previewGroupDraw(): Promise<GroupDrawPreview> {
  await dbConnect();
  return makePreview(await loadContext(), randomBytes(8).toString('hex'));
}

export async function commitGroupDraw(seed: string, fingerprint: string): Promise<{ teamCount: number; fixtureCount: number }> {
  const db = await dbConnect();
  const apply = async (session?: ClientSession) => {
    const context = await loadContext(session);
    if (context.fingerprint !== fingerprint) throw new DomainError('Times ou jogos mudaram. Gere uma nova prévia antes de confirmar.');
    const preview = makePreview(context, seed);
    const fixtures = fixturesFor(preview);
    const groupByTeam = new Map(preview.groups.flatMap((group) => group.teams.map((team) => [team.id, group.id] as const)));

    await Team.bulkWrite(context.teams.map((team) => ({ updateOne: {
      filter: { _id: team._id },
      update: { $set: { groupId: new Types.ObjectId(groupByTeam.get(team._id.toString())!) } },
    } })), { session, ordered: true });
    if (context.groupMatches.length > 0) await Match.deleteMany({ _id: { $in: context.groupMatches.map((match) => match._id) } }, { session });
    await Match.insertMany(fixtures, { session, ordered: true });
    return { teamCount: context.teams.length, fixtureCount: fixtures.length, context, fixtures };
  };

  if (await databaseSupportsTransactions()) {
    const session = await db.startSession();
    try {
      const result = await session.withTransaction(() => apply(session));
      if (!result) throw new DomainError('Não foi possível confirmar o sorteio.');
      return { teamCount: result.teamCount, fixtureCount: result.fixtureCount };
    } finally { await session.endSession(); }
  }

  const locks = db.connection.db!.collection<{ _id: string; token: string; expiresAt: Date }>('group_draw_locks');
  const token = randomBytes(16).toString('hex');
  try {
    await locks.findOneAndUpdate(
      { _id: 'groups', expiresAt: { $lte: new Date() } },
      { $set: { token, expiresAt: new Date(Date.now() + 10 * 60_000) } },
      { upsert: true },
    );
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      throw new DomainError('Outro sorteio está sendo confirmado. Aguarde e atualize a página.');
    }
    throw error;
  }

  let snapshot: Awaited<ReturnType<typeof loadContext>> | null = null;
  let newIds: Types.ObjectId[] = [];
  let safeToRelease = true;
  try {
    snapshot = await loadContext();
    if (snapshot.fingerprint !== fingerprint) throw new DomainError('Times ou jogos mudaram. Gere uma nova prévia antes de confirmar.');
    const preview = makePreview(snapshot, seed);
    const fixtures = fixturesFor(preview);
    newIds = fixtures.map((fixture) => fixture._id);
    const groupByTeam = new Map(preview.groups.flatMap((group) => group.teams.map((team) => [team.id, group.id] as const)));
    await Team.bulkWrite(snapshot.teams.map((team) => ({ updateOne: {
      filter: { _id: team._id },
      update: { $set: { groupId: new Types.ObjectId(groupByTeam.get(team._id.toString())!) } },
    } })), { ordered: true });
    if (snapshot.groupMatches.length > 0) await Match.deleteMany({ _id: { $in: snapshot.groupMatches.map((match) => match._id) } });
    await Match.insertMany(fixtures, { ordered: true });
    return { teamCount: snapshot.teams.length, fixtureCount: fixtures.length };
  } catch (error) {
    if (snapshot && newIds.length > 0) {
      try {
        await Match.deleteMany({ _id: { $in: [...newIds, ...snapshot.groupMatches.map((match) => match._id)] } });
        if (snapshot.groupMatches.length > 0) await Match.insertMany(snapshot.groupMatches, { ordered: true });
        await Team.bulkWrite(snapshot.teams.map((team) => ({ updateOne: {
          filter: { _id: team._id }, update: { $set: { groupId: team.groupId ?? null } },
        } })), { ordered: true });
      } catch (restoreError) {
        safeToRelease = false;
        console.error('[group-draw] falha ao restaurar sorteio local:', restoreError);
        throw new DomainError('O sorteio foi interrompido e os grupos precisam de revisão antes de tentar novamente.');
      }
    }
    throw error;
  } finally {
    if (safeToRelease) await locks.deleteOne({ _id: 'groups', token });
  }
}
