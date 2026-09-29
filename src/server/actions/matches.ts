'use server';

import { adminAction } from '@/server/actions/_helpers';
import {
  bracketSlotSchema,
  finishMatchSchema,
  generateBracketSchema,
  groupMatchSchema,
  matchIdSchema,
  scheduleSchema,
} from '@/features/admin/schemas';
import {
  clearBracket,
  createGroupMatch,
  deleteMatch,
  ensureBracket,
  finishMatch,
  reopenMatch,
  scheduleMatch,
  setBracketSlotTeams,
  updateGroupMatch,
} from '@/server/services/matches';
import { PUBLIC_MATCH_PATHS } from '@/lib/constants';

const REVALIDATE = [
  ...PUBLIC_MATCH_PATHS,
  '/admin',
  '/admin/jogos',
  '/admin/chaveamento',
];

export async function saveGroupMatchAction(input: unknown) {
  return adminAction({
    schema: groupMatchSchema,
    input,
    revalidate: REVALIDATE,
    handler: async (data) => {
      const payload = {
        groupId: data.groupId,
        teamAId: data.teamAId,
        teamBId: data.teamBId,
        scheduledAt: data.scheduledAt,
      };
      return data.id
        ? updateGroupMatch(data.id, payload)
        : createGroupMatch(payload);
    },
  });
}

export async function scheduleMatchAction(input: unknown) {
  return adminAction({
    schema: scheduleSchema,
    input,
    revalidate: REVALIDATE,
    handler: async (data) => scheduleMatch(data.id, data.scheduledAt),
  });
}

export async function finishMatchAction(input: unknown) {
  return adminAction({
    schema: finishMatchSchema,
    input,
    revalidate: REVALIDATE,
    handler: async (data) => finishMatch(data.id, data.scoreA, data.scoreB),
  });
}

export async function reopenMatchAction(input: unknown) {
  return adminAction({
    schema: matchIdSchema,
    input,
    revalidate: REVALIDATE,
    handler: async (data) => reopenMatch(data.id),
  });
}

export async function deleteMatchAction(input: unknown) {
  return adminAction({
    schema: matchIdSchema,
    input,
    revalidate: REVALIDATE,
    handler: async (data) => deleteMatch(data.id),
  });
}

export async function generateBracketAction(input: unknown) {
  return adminAction({
    schema: generateBracketSchema,
    input,
    revalidate: REVALIDATE,
    handler: async (data) => ensureBracket(data.entryStage),
  });
}

export async function clearBracketAction(input: unknown) {
  return adminAction({
    schema: generateBracketSchema.partial(),
    input,
    revalidate: REVALIDATE,
    handler: async () => clearBracket(),
  });
}

export async function setBracketSlotAction(input: unknown) {
  return adminAction({
    schema: bracketSlotSchema,
    input,
    revalidate: REVALIDATE,
    handler: async (data) =>
      setBracketSlotTeams(data.slot, data.teamAId, data.teamBId),
  });
}
