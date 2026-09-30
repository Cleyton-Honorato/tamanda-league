import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { type ClientSession, Types } from 'mongoose';
import { dbConnect } from '@/server/db';
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
    groupId: string;
    groupName: string;
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
  const ungraded = athletes.filter((athlete) => !Number.isInteger(athlete.level) || (athlete.level ?? 0) < 1 || (athlete.level ?? 0) > 5);
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
  const groupTotals = [0, 0];
  const groupCounts = [0, 0];
  const capacity = Math.ceil(result.teams.length / 2);
  const assignments = new Array<number>(result.teams.length);
  const strengthOrder = result.teams.map((team, index) => ({ index, total: team.totalLevel }))
    .sort((a, b) => b.total - a.total || a.index - b.index);

  for (const team of strengthOrder) {
    const group = groupCounts[0] >= capacity ? 1
      : groupCounts[1] >= capacity ? 0
        : groupTotals[0] <= groupTotals[1] ? 0 : 1;
    assignments[team.index] = group;
    groupTotals[group] += team.total;
    groupCounts[group]++;
  }

  return {
    seed,
    fingerprint: context.fingerprint,
    teams: result.teams.map((team, index) => {
      const group = context.groups[assignments[index]];
      return {
        name: `Time ${String(index + 1).padStart(2, '0')}`,
        shortName: `T${String(index + 1).padStart(2, '0')}`,
        groupId: group.id,
        groupName: group.name,
        athletes: team.athletes,
        totalLevel: team.totalLevel,
      };
    }),
    reserves: result.reserves,
  };
}

export async function previewTeamDraw(): Promise<TeamDrawPreview> {
  await dbConnect();
  const context = await drawContext();
  return makePreview(context, randomBytes(8).toString('hex'));
}

export async function commitTeamDraw(seed: string, fingerprint: string): Promise<{ teamCount: number; reserveCount: number }> {
  const db = await dbConnect();
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
        groupId: new Types.ObjectId(team.groupId),
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
