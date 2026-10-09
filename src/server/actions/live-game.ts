'use server';
import { z } from 'zod';
import { adminAction } from './_helpers';
import { changeLiveGame, readLiveGame } from '@/server/services/live-game';
import { finishMatch } from '@/server/services/matches';
import { gameTotals, remainingTime } from '@/lib/live-game';
import { DomainError } from '@/server/errors';
import { PUBLIC_MATCH_PATHS } from '@/lib/constants';

const identity = z.object({ id: z.string().regex(/^[a-f0-9]{24}$/i) });
const versioned = identity.extend({ version: z.number().int().nonnegative() });
const command = z.discriminatedUnion('type', [
  z.object({ type: z.literal('score'), playerId: z.string().regex(/^[a-f0-9]{24}$/i), points: z.union([z.literal(1), z.literal(2)]), eventId: z.string().uuid() }),
  z.object({ type: z.literal('undo'), eventId: z.string().uuid() }),
  z.object({ type: z.literal('start') }), z.object({ type: z.literal('pause') }),
  z.object({ type: z.literal('clock'), seconds: z.number().int().min(0).max(3600) }),
]);
export async function readLiveGameAction(input: unknown) {
  return adminAction({ schema: identity, input, handler: ({ id }) => readLiveGame(id) });
}
export async function changeLiveGameAction(input: unknown) {
  return adminAction({ schema: versioned.extend({ command }), input, handler: ({ id, version, command }) => changeLiveGame(id, version, command) });
}
export async function finishLiveGameAction(input: unknown) {
  return adminAction({ schema: versioned, input, revalidate: [...PUBLIC_MATCH_PATHS, '/admin', '/admin/jogos', '/admin/chaveamento'], handler: async ({ id, version }) => {
    const state = await readLiveGame(id);
    if (state.version !== version) throw new DomainError('A mesa mudou. Atualize antes de encerrar.');
    if (state.game.startedAt !== null && remainingTime(state.game, Date.now()) > 0) throw new DomainError('Pause o cronômetro antes de encerrar.');
    const totals = gameTotals(state.game);
    await finishMatch(id, totals.A, totals.B, version);
    return readLiveGame(id);
  } });
}
