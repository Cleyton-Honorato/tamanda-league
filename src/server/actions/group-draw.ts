'use server';

import { z } from 'zod';
import { adminAction } from '@/server/actions/_helpers';
import { commitGroupDraw, previewGroupDraw } from '@/server/services/group-draw';
import { PUBLIC_MATCH_PATHS } from '@/lib/constants';

export async function previewGroupDrawAction(input: unknown) {
  return adminAction({
    schema: z.object({}),
    input,
    handler: () => previewGroupDraw(),
  });
}

export async function commitGroupDrawAction(input: unknown) {
  return adminAction({
    schema: z.object({
      seed: z.string().regex(/^[0-9a-f]{16}$/),
      fingerprint: z.string().regex(/^[0-9a-f]{64}$/),
    }),
    input,
    revalidate: [...PUBLIC_MATCH_PATHS, '/admin', '/admin/grupos', '/admin/times', '/admin/jogos'],
    handler: (data) => commitGroupDraw(data.seed, data.fingerprint),
  });
}
