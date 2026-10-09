import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { type ClientSession, Types } from 'mongoose';
import { dbConnect } from '@/server/db';
import { databaseSupportsTransactions } from '@/server/db-capabilities';
import { DomainError } from '@/server/errors';
import { Athlete } from '@/server/models/athlete';
import { Group } from '@/server/models/group';
import { Team } from '@/server/models/team';
import { drawBalancedTeams, type DrawAthlete } from '@/lib/team-draw';

export interface TeamDrawPreview {
  seed: string;
  fingerprint: string;
  teams: {
    name: string;
    shortName: string;
    athletes: DrawAthlete[];
    totalLevel: number;
  }[];
  reserves: DrawAthlete[];
}

async function drawContext(session?: ClientSession) {
  const [athletes, groups, teamCount] = await Promise.all([
    Athlete.find().sort({ _id: 1 }).session(session ?? null).lean(),
    Group.find().sort({ order: 1, name: 1 }).session(session ?? null).lean(),
    Team.countDocuments().session(session ?? null),
  ]);

  if (teamCount > 0 || athletes.some((athlete) => athlete.teamId)) {
    throw new DomainError('O sorteio inicial só pode ser feito antes de criar ou atribuir times.');
  }
  if (groups.length !== 2) throw new DomainError('Cadastre as duas conferências antes do sorteio.');
  if (athletes.length < 4) throw new DomainError('Cadastre ao menos quatro atletas para sortear um time.');
  const ungraded = athletes.filter((athlete) => athlete.level === null || !Number.isInteger(athlete.level * 2) || athlete.level < 0.5 || athlete.level > 5);
  if (ungraded.length > 0) throw new DomainError(`Avalie os ${ungraded.length} atleta(s) sem estrelas antes do sorteio.`);

  const fingerprint = createHash('sha256').update(JSON.stringify({
    athletes: athletes.map((athlete) => [athlete._id.toString(), athlete.name, athlete.level]),
    groups: groups.map((group) => group._id.toString()),
  })).digest('hex');

  return {
    athletes: athletes.map((athlete) => ({ id: athlete._id.toString(), name: athlete.name, level: athlete.level! })),
    groups: groups.map((group) => ({ id: group._id.toString(), name: group.name })),
    fingerprint,
  };
}

function makePreview(context: Awaited<ReturnType<typeof drawContext>>, seed: string): TeamDrawPreview {
  const result = drawBalancedTeams(context.athletes, seed);

  return {
    seed,
    fingerprint: context.fingerprint,
    teams: result.teams.map((team, index) => ({
        name: `Time ${String(index + 1).padStart(2, '0')}`,
        shortName: `T${String(index + 1).padStart(2, '0')}`,
        athletes: team.athletes,
        totalLevel: team.totalLevel,
    })),
    reserves: result.reserves,
  };
}

export async function previewTeamDraw(): Promise<TeamDrawPreview> {
  await dbConnect();
  const context = await drawContext();
  return makePreview(context, randomBytes(8).toString('hex'));
}

type DrawLock = {
  _id: string;
  token: string;
  teamIds: string[];
  expiresAt: Date;
  status: 'working' | 'complete';
};

async function removeAttempt(teamIds: string[]): Promise<void> {
  if (teamIds.length === 0) return;
  const ids = teamIds.map((id) => new Types.ObjectId(id));
  // Nunca reverta um time que já esteja em um jogo.
  const { Match } = await import('@/server/models/match');
  if (await Match.exists({ $or: [{ teamAId: { $in: ids } }, { teamBId: { $in: ids } }] })) {
    throw new DomainError('O sorteio incompleto já possui jogos. Revise os dados antes de tentar novamente.');
  }
  await Athlete.updateMany({ teamId: { $in: ids } }, { $set: { teamId: null } });
  await Team.deleteMany({ _id: { $in: ids } });
}

/** No Mongo local, serializa a operação e reverte apenas os IDs desta tentativa. */
async function commitWithoutTransaction(seed: string, fingerprint: string): Promise<{ teamCount: number; reserveCount: number }> {
  const db = await dbConnect();
  const locks = db.connection.db!.collection<DrawLock>('team_draw_locks');
  const token = randomBytes(16).toString('hex');
  let previous: DrawLock | null;
  try {
    previous = await locks.findOneAndUpdate(
      { _id: 'initial', expiresAt: { $lte: new Date() } },
      { $set: { token, status: 'working', expiresAt: new Date(Date.now() + 10 * 60_000) }, $setOnInsert: { teamIds: [] } },
      { upsert: true, returnDocument: 'before' },
    );
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      throw new DomainError('Outro sorteio está sendo confirmado. Aguarde e atualize a página.');
    }
    throw error;
  }

  let ownedIds: string[] = [];
  let safeToRelease = false;
  try {
    if (previous?.status === 'complete') {
      safeToRelease = true;
      throw new DomainError('O sorteio já foi confirmado. Atualize a página para ver os times.');
    }
    if (previous?.teamIds.length) {
      const previousIds = previous.teamIds.map((id) => new Types.ObjectId(id));
      const [teamCount, assignedCount] = await Promise.all([
        Team.countDocuments({ _id: { $in: previousIds } }),
        Athlete.countDocuments({ teamId: { $in: previousIds } }),
      ]);
      if (teamCount === previousIds.length && assignedCount === previousIds.length * 4) {
        safeToRelease = true;
        throw new DomainError('O sorteio anterior já foi confirmado. Atualize a página para ver os times.');
      }
      await removeAttempt(previous.teamIds);
    }
    safeToRelease = true;
    const context = await drawContext();
    if (context.fingerprint !== fingerprint) {
      throw new DomainError('Atletas ou conferências mudaram. Gere uma nova prévia antes de confirmar.');
    }
    const preview = makePreview(context, seed);
    ownedIds = preview.teams.map(() => new Types.ObjectId().toString());
    const recorded = await locks.updateOne({ _id: 'initial', token }, { $set: { teamIds: ownedIds } });
    if (recorded.matchedCount !== 1) throw new DomainError('O bloqueio do sorteio expirou. Gere uma nova prévia.');
    await Team.insertMany(preview.teams.map((team, index) => ({
      _id: new Types.ObjectId(ownedIds[index]),
      name: team.name,
      shortName: team.shortName,
      groupId: null,
      crestPublicId: null,
      crestUrl: null,
    })), { ordered: true });
    const operations = preview.teams.flatMap((team, index) => team.athletes.map((athlete) => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(athlete.id), teamId: null },
        update: { $set: { teamId: new Types.ObjectId(ownedIds[index]) } },
      },
    })));
    const updated = await Athlete.bulkWrite(operations);
    if (updated.modifiedCount !== operations.length) {
      throw new DomainError('A lista de atletas mudou durante o sorteio. Gere uma nova prévia.');
    }
    const completed = await locks.updateOne({ _id: 'initial', token }, { $set: { status: 'complete' } });
    if (completed.matchedCount !== 1) throw new DomainError('O bloqueio do sorteio expirou. Atualize a página.');
    return { teamCount: ownedIds.length, reserveCount: preview.reserves.length };
  } catch (error) {
    if (safeToRelease && ownedIds.length === 0 && previous?.teamIds.length) throw error;
    try {
      await removeAttempt(ownedIds);
      if (safeToRelease) await locks.updateOne({ _id: 'initial', token }, { $set: { teamIds: [] } });
    }
    catch (cleanupError) {
      safeToRelease = false;
      console.error('[team-draw] falha ao reverter sorteio local:', cleanupError);
      throw new DomainError('O sorteio foi interrompido e precisa de revisão antes de uma nova tentativa.');
    }
    throw error;
  } finally {
    // Em falha de recuperação, preserve o bloqueio e os IDs para a próxima tentativa.
    if (safeToRelease) await locks.deleteOne({ _id: 'initial', token });
  }
}

export async function commitTeamDraw(seed: string, fingerprint: string): Promise<{ teamCount: number; reserveCount: number }> {
  const db = await dbConnect();
  if (!await databaseSupportsTransactions()) return commitWithoutTransaction(seed, fingerprint);
  const session = await db.startSession();
  try {
    const result = await session.withTransaction(async () => {
      const context = await drawContext(session);
      if (context.fingerprint !== fingerprint) {
        throw new DomainError('Atletas ou conferências mudaram. Gere uma nova prévia antes de confirmar.');
      }
      const preview = makePreview(context, seed);
      const created = await Team.insertMany(preview.teams.map((team) => ({
        name: team.name,
        shortName: team.shortName,
        groupId: null,
        crestPublicId: null,
        crestUrl: null,
      })), { session });
      const operations = preview.teams.flatMap((team, index) => team.athletes.map((athlete) => ({
        updateOne: {
          filter: { _id: new Types.ObjectId(athlete.id), teamId: null },
          update: { $set: { teamId: created[index]._id } },
        },
      })));
      const updated = await Athlete.bulkWrite(operations, { session });
      if (updated.modifiedCount !== operations.length) {
        throw new DomainError('A lista de atletas mudou durante o sorteio. Gere uma nova prévia.');
      }
      return { teamCount: created.length, reserveCount: preview.reserves.length };
    });
    if (!result) throw new DomainError('Não foi possível confirmar o sorteio.');
    return result;
  } finally {
    await session.endSession();
  }
}
