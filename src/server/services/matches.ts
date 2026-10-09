import 'server-only';
import { Types } from 'mongoose';
import { dbConnect } from '@/server/db';
import { DomainError, NotFoundError } from '@/server/errors';
import { Match, type MatchDocument } from '@/server/models/match';
import { Team } from '@/server/models/team';
import { Athlete } from '@/server/models/athlete';
import { Group } from '@/server/models/group';
import { databaseSupportsTransactions } from '@/server/db-capabilities';
import { groupFixtures } from '@/lib/group-fixtures';
import { gameTotals, remainingTime } from '@/lib/live-game';
import { toMatchDto } from '@/server/serialization';
import { getTeamsIndex } from '@/server/services/teams';
import { nextPosition, stagesFrom, winnerOf } from '@/server/services/bracket';
import { computeStandings, type StandingsMatchInput } from '@/server/services/standings';
import {
  KNOCKOUT_STAGES,
  STAGE_SLOTS,
  type KnockoutStage,
  type MatchDto,
  type StandingRow,
} from '@/lib/types';

type LeanMatch = Pick<
  MatchDocument,
  | '_id'
  | 'stage'
  | 'groupId'
  | 'slot'
  | 'teamAId'
  | 'teamBId'
  | 'scheduledAt'
  | 'status'
  | 'scoreA'
  | 'scoreB'
>;

/** Resolve os times de uma vez só, em vez de uma consulta por jogo. */
async function hydrate(matches: LeanMatch[]): Promise<MatchDto[]> {
  const teamsById = await getTeamsIndex();
  return matches.map((match) => toMatchDto(match, teamsById));
}

export async function listMatches(): Promise<MatchDto[]> {
  await dbConnect();
  const matches = await Match.find().sort({ scheduledAt: 1, createdAt: 1 }).lean();
  return hydrate(matches);
}

export async function listGroupMatches(): Promise<MatchDto[]> {
  await dbConnect();
  const matches = await Match.find({ stage: 'GROUP' })
    .sort({ round: 1, scheduledAt: 1, createdAt: 1 })
    .lean();
  return hydrate(matches);
}

/** Monta um turno único por conferência, sem definir datas automaticamente. */
export async function generateGroupFixtures(): Promise<number> {
  const db = await dbConnect();
  const [groups, teams, existing] = await Promise.all([
    Group.find().sort({ order: 1, name: 1 }).lean(),
    Team.find().sort({ name: 1 }).lean(),
    Match.countDocuments({ stage: 'GROUP' }),
  ]);
  if (existing) throw new DomainError('A fase de grupos já possui jogos. Edite ou exclua os confrontos existentes antes de gerar novamente.');
  if (groups.length !== 2) throw new DomainError('Cadastre as duas conferências antes de montar a fase de grupos.');
  if (teams.some((team) => !team.groupId || !groups.some((group) => group._id.equals(team.groupId)))) {
    throw new DomainError('Todos os times precisam pertencer a uma das duas conferências.');
  }
  const rosters = await Athlete.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { teamId: { $ne: null } } },
    { $group: { _id: '$teamId', count: { $sum: 1 } } },
  ]);
  const rosterByTeam = new Map(rosters.map((roster) => [roster._id.toString(), roster.count]));
  if (teams.some((team) => rosterByTeam.get(team._id.toString()) !== 4)) {
    throw new DomainError('Cada time precisa ter quatro atletas antes de montar os jogos.');
  }
  const fixtures = groups.flatMap((group) => {
    const members = teams.filter((team) => team.groupId?.equals(group._id)).map((team) => team._id.toString());
    if (members.length < 2) throw new DomainError(`A ${group.name} precisa ter ao menos dois times.`);
    return groupFixtures(members).map((fixture) => ({
      _id: new Types.ObjectId(),
      stage: 'GROUP' as const,
      groupId: group._id,
      round: fixture.round,
      slot: null,
      teamAId: new Types.ObjectId(fixture.teamAId),
      teamBId: new Types.ObjectId(fixture.teamBId),
      scheduledAt: null,
      status: 'SCHEDULED' as const,
    }));
  });
  if (await databaseSupportsTransactions()) {
    const session = await db.startSession();
    try {
      await session.withTransaction(async () => {
        if (await Match.countDocuments({ stage: 'GROUP' }).session(session)) throw new DomainError('A fase de grupos já foi montada. Atualize a página.');
        await Match.insertMany(fixtures, { session, ordered: true });
      });
    } finally { await session.endSession(); }
  } else {
    try {
      if (await Match.countDocuments({ stage: 'GROUP' })) throw new DomainError('A fase de grupos já foi montada. Atualize a página.');
      await Match.insertMany(fixtures, { ordered: true });
    } catch (error) {
      await Match.deleteMany({ _id: { $in: fixtures.map((fixture) => fixture._id) } });
      throw error;
    }
  }
  return fixtures.length;
}

export async function listKnockoutMatches(): Promise<MatchDto[]> {
  await dbConnect();
  const matches = await Match.find({ stage: { $ne: 'GROUP' } })
    .sort({ slot: 1 })
    .lean();

  const hydrated = await hydrate(matches);
  // Ordena pela sequência das rodadas — `stage` é string, então o sort do Mongo
  // devolveria F antes de QF.
  return hydrated.sort((a, b) => {
    const stageDiff =
      KNOCKOUT_STAGES.indexOf(a.stage as KnockoutStage) -
      KNOCKOUT_STAGES.indexOf(b.stage as KnockoutStage);
    return stageDiff !== 0 ? stageDiff : (a.slot ?? 0) - (b.slot ?? 0);
  });
}

export async function getMatch(id: string): Promise<MatchDto> {
  await dbConnect();
  const match = await Match.findById(id).lean();
  if (!match) throw new NotFoundError('Jogo não encontrado.');
  const [dto] = await hydrate([match]);
  return dto;
}

export async function countMatches(): Promise<{
  total: number;
  scheduled: number;
  finished: number;
}> {
  await dbConnect();
  const [total, scheduled, finished] = await Promise.all([
    Match.countDocuments(),
    Match.countDocuments({ status: 'SCHEDULED' }),
    Match.countDocuments({ status: 'FINISHED' }),
  ]);
  return { total, scheduled, finished };
}

/** Soma as cestas atribuídas aos atletas na mesa de jogo, inclusive em partidas em andamento. */
export async function getTopScorer(): Promise<{ athleteId: string; points: number; name: string } | null> {
  await dbConnect();
  const games = await Match.find({ 'live.baskets.0': { $exists: true } }).select({ live: 1 }).lean();
  const totals = new Map<string, { points: number; name: string }>();
  for (const game of games) {
    if (!game.live) continue;
    const players = new Map(game.live.players.map((player) => [player.id, player.name]));
    for (const basket of game.live.baskets) {
      const name = players.get(basket.playerId);
      if (!name) continue;
      const current = totals.get(basket.playerId);
      totals.set(basket.playerId, { points: (current?.points ?? 0) + basket.points, name });
    }
  }
  const leader = [...totals].sort((a, b) => b[1].points - a[1].points || a[1].name.localeCompare(b[1].name, 'pt-BR'))[0];
  return leader ? { athleteId: leader[0], ...leader[1] } : null;
}

export interface GroupMatchInput {
  groupId: string;
  teamAId: string;
  teamBId: string;
  scheduledAt: Date | null;
}

async function assertTeamsExist(teamAId: string, teamBId: string) {
  if (teamAId === teamBId) {
    throw new DomainError('Um time não pode jogar contra ele mesmo.', 'teamBId');
  }
  const count = await Team.countDocuments({ _id: { $in: [teamAId, teamBId] } });
  if (count !== 2) {
    throw new DomainError('Time não encontrado.');
  }
  const rosters = await Athlete.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { teamId: { $in: [new Types.ObjectId(teamAId), new Types.ObjectId(teamBId)] } } },
    { $group: { _id: '$teamId', count: { $sum: 1 } } },
  ]);
  if (rosters.length !== 2 || rosters.some((roster) => roster.count !== 4)) {
    throw new DomainError('Cada time precisa ter exatamente quatro atletas antes de agendar jogos.');
  }
}

async function assertTeamsInGroup(groupId: string, teamAId: string, teamBId: string) {
  const count = await Team.countDocuments({
    _id: { $in: [teamAId, teamBId] },
    groupId: new Types.ObjectId(groupId),
  });
  if (count !== 2) {
    throw new DomainError('Os dois times precisam pertencer à mesma conferência do jogo.', 'groupId');
  }
}

export async function createGroupMatch(
  input: GroupMatchInput,
): Promise<MatchDto> {
  await dbConnect();
  await assertTeamsExist(input.teamAId, input.teamBId);
  await assertTeamsInGroup(input.groupId, input.teamAId, input.teamBId);

  const match = await Match.create({
    stage: 'GROUP',
    groupId: new Types.ObjectId(input.groupId),
    slot: null,
    teamAId: new Types.ObjectId(input.teamAId),
    teamBId: new Types.ObjectId(input.teamBId),
    scheduledAt: input.scheduledAt,
    status: 'SCHEDULED',
  });

  const [dto] = await hydrate([match]);
  return dto;
}

export async function updateGroupMatch(
  id: string,
  input: GroupMatchInput,
): Promise<MatchDto> {
  await dbConnect();
  await assertTeamsExist(input.teamAId, input.teamBId);
  await assertTeamsInGroup(input.groupId, input.teamAId, input.teamBId);

  const match = await Match.findById(id);
  if (!match) throw new NotFoundError('Jogo não encontrado.');
  if (match.stage !== 'GROUP') {
    throw new DomainError('Esse jogo é do mata-mata e é editado no chaveamento.');
  }

  match.groupId = new Types.ObjectId(input.groupId);
  if (match.live && (match.teamAId?.toString() !== input.teamAId || match.teamBId?.toString() !== input.teamBId)) {
    throw new DomainError('Este jogo já possui uma mesa registrada. Os times não podem ser trocados.');
  }
  match.teamAId = new Types.ObjectId(input.teamAId);
  match.teamBId = new Types.ObjectId(input.teamBId);
  match.scheduledAt = input.scheduledAt;
  await match.save();

  const [dto] = await hydrate([match]);
  return dto;
}

/** Remarca qualquer jogo — inclusive os do chaveamento, que não têm CRUD. */
export async function scheduleMatch(
  id: string,
  scheduledAt: Date | null,
): Promise<MatchDto> {
  await dbConnect();
  const match = await Match.findByIdAndUpdate(
    id,
    { scheduledAt },
    { returnDocument: 'after' },
  ).lean();
  if (!match) throw new NotFoundError('Jogo não encontrado.');
  const [dto] = await hydrate([match]);
  return dto;
}

export async function deleteMatch(id: string): Promise<void> {
  await dbConnect();
  const match = await Match.findById(id).lean();
  if (!match) throw new NotFoundError('Jogo não encontrado.');
  if (match.stage !== 'GROUP') {
    throw new DomainError(
      'Jogos do mata-mata fazem parte do chaveamento e não podem ser excluídos avulsos.',
    );
  }
  await Match.findByIdAndDelete(id);
}

/**
 * Jogo seguinte no chaveamento, se houver. Usado para propagar o vencedor e
 * para barrar alterações que deixariam o chaveamento inconsistente.
 */
async function findNextMatch(match: LeanMatch) {
  if (match.stage === 'GROUP' || match.slot === null) return null;
  const position = nextPosition(match.stage as KnockoutStage, match.slot);
  if (!position) return null;
  return Match.findOne({ stage: position.stage, slot: position.slot });
}

export async function finishMatch(
  id: string,
  scoreA: number,
  scoreB: number,
  expectedVersion?: number,
): Promise<MatchDto> {
  await dbConnect();

  if (!Number.isInteger(scoreA) || !Number.isInteger(scoreB)) {
    throw new DomainError('O placar deve ser um número inteiro.');
  }
  if (scoreA < 0 || scoreB < 0) {
    throw new DomainError('O placar não pode ser negativo.');
  }
  if (scoreA === scoreB) {
    throw new DomainError('No 3x3 não existe empate — o placar tem que ter um vencedor.');
  }

  const match = await Match.findById(id);
  if (!match) throw new NotFoundError('Jogo não encontrado.');
  if (expectedVersion !== undefined && (match.__v ?? 0) !== expectedVersion) throw new DomainError('A mesa mudou. Atualize antes de encerrar.');
  if (match.live) {
    const totals = gameTotals(match.live);
    if (scoreA !== totals.A || scoreB !== totals.B) throw new DomainError('Ajuste as cestas na mesa de jogo para corrigir este placar.');
    match.live = { ...match.live, remainingMs: remainingTime(match.live, Date.now()), startedAt: null };
    match.markModified('live');
  }
  if (!match.teamAId || !match.teamBId) {
    throw new DomainError('Defina os dois times antes de lançar o placar.');
  }

  const next = await findNextMatch(match);
  if (next && (next.status === 'FINISHED' || next.live)) {
    throw new DomainError(
      'O jogo seguinte do chaveamento já tem resultado ou mesa registrada. Não é possível alterar este resultado.',
    );
  }

  match.status = 'FINISHED';
  match.scoreA = scoreA;
  match.scoreB = scoreB;
  await match.save();

  // Propaga o vencedor. Rodar mesmo em correção de placar mantém o chaveamento
  // coerente quando o admin inverte o resultado.
  if (next && match.slot !== null) {
    const position = nextPosition(match.stage as KnockoutStage, match.slot)!;
    const winnerId = winnerOf({
      teamAId: match.teamAId.toString(),
      teamBId: match.teamBId.toString(),
      scoreA,
      scoreB,
    });

    if (position.side === 'A') {
      next.teamAId = new Types.ObjectId(winnerId);
    } else {
      next.teamBId = new Types.ObjectId(winnerId);
    }
    await next.save();
  }

  const [dto] = await hydrate([match]);
  return dto;
}

export async function reopenMatch(id: string): Promise<MatchDto> {
  await dbConnect();

  const match = await Match.findById(id);
  if (!match) throw new NotFoundError('Jogo não encontrado.');

  const next = await findNextMatch(match);
  if (next && (next.status === 'FINISHED' || next.live)) {
    throw new DomainError(
      'O jogo seguinte do chaveamento já tem resultado ou mesa registrada. Não é possível reabrir este jogo.',
    );
  }

  match.status = 'SCHEDULED';
  match.scoreA = null;
  match.scoreB = null;
  await match.save();

  // Tira do jogo seguinte o time que só estava lá por causa deste resultado.
  if (next && match.slot !== null) {
    const position = nextPosition(match.stage as KnockoutStage, match.slot)!;
    if (position.side === 'A') next.teamAId = null;
    else next.teamBId = null;
    await next.save();
  }

  const [dto] = await hydrate([match]);
  return dto;
}

/** Rodada em que o chaveamento começa — a mais antiga que tem jogos criados. */
export async function getBracketEntryStage(): Promise<KnockoutStage | null> {
  await dbConnect();
  for (const stage of KNOCKOUT_STAGES) {
    const exists = await Match.exists({ stage });
    if (exists) return stage;
  }
  return null;
}

/**
 * Cria o esqueleto do mata-mata (sem times, sem data). Idempotente: rodar de
 * novo só preenche o que faltar.
 */
export async function ensureBracket(entryStage: KnockoutStage): Promise<void> {
  await dbConnect();

  const current = await getBracketEntryStage();
  if (current && current !== entryStage) {
    throw new DomainError(
      `Já existe um chaveamento começando nas ${current === 'R16' ? 'oitavas' : 'quartas'}. Apague-o antes de gerar outro.`,
    );
  }

  for (const stage of stagesFrom(entryStage)) {
    for (let slot = 1; slot <= STAGE_SLOTS[stage]; slot += 1) {
      await Match.updateOne(
        { stage, slot },
        {
          $setOnInsert: {
            stage,
            slot,
            groupId: null,
            teamAId: null,
            teamBId: null,
            scheduledAt: null,
            status: 'SCHEDULED',
            scoreA: null,
            scoreB: null,
          },
        },
        { upsert: true },
      );
    }
  }
}

export async function clearBracket(): Promise<void> {
  await dbConnect();
  await Match.deleteMany({ stage: { $ne: 'GROUP' } });
}

/**
 * Define os times de um confronto da rodada de entrada. As rodadas seguintes
 * são preenchidas pelos vencedores, nunca à mão.
 */
export async function setBracketSlotTeams(
  slot: number,
  teamAId: string | null,
  teamBId: string | null,
): Promise<MatchDto> {
  await dbConnect();

  const entryStage = await getBracketEntryStage();
  if (!entryStage) {
    throw new DomainError('Gere o chaveamento antes de definir os confrontos.');
  }

  const match = await Match.findOne({ stage: entryStage, slot });
  if (!match) throw new NotFoundError('Confronto não encontrado.');
  if (match.status === 'FINISHED') {
    throw new DomainError('Reabra o jogo antes de trocar os times.');
  }
  if (match.live && (match.teamAId?.toString() !== (teamAId ?? undefined) || match.teamBId?.toString() !== (teamBId ?? undefined))) {
    throw new DomainError('Este confronto já possui uma mesa registrada. Os times não podem ser trocados.');
  }

  if (teamAId && teamBId && teamAId === teamBId) {
    throw new DomainError('Um time não pode jogar contra ele mesmo.', 'teamBId');
  }

  // Um time só pode entrar em uma chave.
  const chosen = [teamAId, teamBId].filter((id): id is string => Boolean(id));
  if (chosen.length > 0) {
    const conflict = await Match.findOne({
      stage: entryStage,
      slot: { $ne: slot },
      $or: [{ teamAId: { $in: chosen } }, { teamBId: { $in: chosen } }],
    }).lean();
    if (conflict) {
      throw new DomainError(
        `Esse time já está no confronto ${conflict.slot} do chaveamento.`,
      );
    }
  }

  match.teamAId = teamAId ? new Types.ObjectId(teamAId) : null;
  match.teamBId = teamBId ? new Types.ObjectId(teamBId) : null;
  await match.save();

  const [dto] = await hydrate([match]);
  return dto;
}

export async function getGroupStandings(groupId: string): Promise<StandingRow[]> {
  await dbConnect();

  const [teams, matches] = await Promise.all([
    Team.find({ groupId }).select('_id').lean(),
    Match.find({ stage: 'GROUP', groupId, status: 'FINISHED' })
      .select('teamAId teamBId scoreA scoreB')
      .lean(),
  ]);

  const finished: StandingsMatchInput[] = matches
    .filter(
      (match) =>
        match.teamAId &&
        match.teamBId &&
        match.scoreA !== null &&
        match.scoreB !== null,
    )
    .map((match) => ({
      teamAId: match.teamAId!.toString(),
      teamBId: match.teamBId!.toString(),
      scoreA: match.scoreA!,
      scoreB: match.scoreB!,
    }));

  return computeStandings(
    teams.map((team) => team._id.toString()),
    finished,
  );
}
