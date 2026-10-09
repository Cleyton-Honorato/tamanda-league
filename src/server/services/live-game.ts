import 'server-only';
import { dbConnect } from '@/server/db';
import { Match } from '@/server/models/match';
import { Athlete } from '@/server/models/athlete';
import { DomainError, NotFoundError } from '@/server/errors';
import { applyGameCommand, type GameCommand, type LiveGame } from '@/lib/live-game';

export async function readLiveGame(id: string) {
  await dbConnect();
  const match = await Match.findById(id).lean();
  if (!match) throw new NotFoundError('Jogo não encontrado.');
  if (!match.teamAId || !match.teamBId) throw new DomainError('Defina os dois times antes de abrir a mesa.');
  const athletes = match.live ? [] : await Athlete.find({ teamId: { $in: [match.teamAId, match.teamBId] } }).sort({ name: 1 }).lean();
  const game: LiveGame = match.live ?? {
    remainingMs: 600000, startedAt: null, baskets: [],
    players: athletes.map((athlete) => ({ id: athlete._id.toString(), name: athlete.nickname || athlete.name, team: athlete.teamId!.equals(match.teamAId!) ? 'A' : 'B' })),
  };
  return { game, version: match.__v ?? 0, status: match.status, serverNow: Date.now(), teamAId: match.teamAId.toString(), teamBId: match.teamBId.toString(), scoreA: match.scoreA, scoreB: match.scoreB };
}

export async function changeLiveGame(id: string, version: number, command: GameCommand) {
  const current = await readLiveGame(id);
  if (current.status === 'FINISHED') throw new DomainError('O jogo está encerrado. Reabra-o para alterar a mesa.');
  if (current.version !== version) throw new DomainError('A mesa mudou em outra aba. Atualize antes de continuar.');
  if (current.game.players.filter((p) => p.team === 'A').length !== 4 || current.game.players.filter((p) => p.team === 'B').length !== 4) throw new DomainError('Cada time precisa ter quatro atletas para usar a mesa.');
  let game: LiveGame;
  try { game = applyGameCommand(current.game, command, Date.now()); }
  catch (error) { throw new DomainError(error instanceof Error ? error.message : 'Não foi possível registrar a operação.'); }
  const updated = await Match.findOneAndUpdate(
    { _id: id, status: 'SCHEDULED', teamAId: current.teamAId, teamBId: current.teamBId, ...(version === 0 ? { $or: [{ __v: 0 }, { __v: { $exists: false } }] } : { __v: version }) },
    { $set: { live: game }, $inc: { __v: 1 } }, { returnDocument: 'after' },
  );
  if (!updated) throw new DomainError('A mesa mudou. Atualize antes de continuar.');
  return { ...current, game, version: version + 1, serverNow: Date.now() };
}
