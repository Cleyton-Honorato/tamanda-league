export interface GamePlayer { id: string; name: string; team: 'A' | 'B' }
export interface GameBasket { id: string; playerId: string; points: number; remainingMs: number }
export interface LiveGame {
  players: GamePlayer[];
  baskets: GameBasket[];
  remainingMs: number;
  startedAt: number | null;
}
export type GameCommand =
  | { type: 'score'; playerId: string; points: 1 | 2; eventId: string }
  | { type: 'undo'; eventId: string }
  | { type: 'start' }
  | { type: 'pause' }
  | { type: 'clock'; seconds: number };

export function remainingTime(game: LiveGame, now: number) {
  return Math.max(0, game.remainingMs - (game.startedAt === null ? 0 : Math.max(0, now - game.startedAt)));
}
export function gameTotals(game: LiveGame) {
  const totals = { A: 0, B: 0 };
  for (const basket of game.baskets) {
    const player = game.players.find((item) => item.id === basket.playerId);
    if (player) totals[player.team] += basket.points;
  }
  return totals;
}
export function applyGameCommand(game: LiveGame, command: GameCommand, now: number): LiveGame {
  const next: LiveGame = { ...game, baskets: [...game.baskets] };
  if (command.type === 'score') {
    if (!game.players.some((player) => player.id === command.playerId)) throw new Error('Jogador não pertence a este jogo.');
    if (![1, 2].includes(command.points)) throw new Error('A cesta deve valer 1 ou 2 pontos.');
    if (game.baskets.some((basket) => basket.id === command.eventId)) return game;
    next.baskets.push({ id: command.eventId, playerId: command.playerId, points: command.points, remainingMs: remainingTime(game, now) });
  } else if (command.type === 'undo') {
    if (!game.baskets.some((basket) => basket.id === command.eventId)) throw new Error('Cesta já removida. Atualize a mesa.');
    next.baskets = game.baskets.filter((basket) => basket.id !== command.eventId);
  } else if (command.type === 'start') {
    if (game.startedAt !== null && remainingTime(game, now) > 0) return game;
    if (remainingTime(game, now) === 0) throw new Error('Ajuste o tempo antes de iniciar.');
    next.startedAt = now;
  } else if (command.type === 'pause') {
    next.remainingMs = remainingTime(game, now);
    next.startedAt = null;
  } else {
    if (game.startedAt !== null && remainingTime(game, now) > 0) throw new Error('Pause o cronômetro antes de ajustar.');
    if (!Number.isInteger(command.seconds) || command.seconds < 0 || command.seconds > 3600) throw new Error('Use um tempo entre 00:00 e 60:00.');
    next.remainingMs = command.seconds * 1000;
    next.startedAt = null;
  }
  return next;
}
