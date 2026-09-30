'use server';

import { z } from 'zod';
import { adminAction } from '@/server/actions/_helpers';
import { commitTeamDraw, previewTeamDraw } from '@/server/services/team-draw';
import { PUBLIC_MATCH_PATHS } from '@/lib/constants';

export async function previewTeamDrawAction(input: unknown) {
  return adminAction({
    schema: z.object({}),
    input,
    handler: () => previewTeamDraw(),
  });
}

export async function commitTeamDrawAction(input: unknown) {
  return adminAction({
    schema: z.object({
      seed: z.string().regex(/^[0-9a-f]{16}$/),
      fingerprint: z.string().regex(/^[0-9a-f]{64}$/),
    }),
    input,
    revalidate: [...PUBLIC_MATCH_PATHS, '/admin', '/admin/atletas', '/admin/times', '/admin/grupos'],
    handler: (data) => commitTeamDraw(data.seed, data.fingerprint),
  });
}
