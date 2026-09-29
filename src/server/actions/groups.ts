'use server';

import { adminAction } from '@/server/actions/_helpers';
import { groupSchema } from '@/features/admin/schemas';
import {
  createGroup,
  deleteGroup,
  updateGroup,
} from '@/server/services/groups';
import { PUBLIC_MATCH_PATHS } from '@/lib/constants';
import { z } from 'zod';

const REVALIDATE = [...PUBLIC_MATCH_PATHS, '/admin/grupos', '/admin/jogos'];

export async function saveGroupAction(input: unknown) {
  return adminAction({
    schema: groupSchema,
    input,
    revalidate: REVALIDATE,
    handler: async (data) =>
      data.id
        ? updateGroup(data.id, { name: data.name, order: data.order })
        : createGroup({ name: data.name, order: data.order }),
  });
}

export async function deleteGroupAction(input: unknown) {
  return adminAction({
    schema: z.object({ id: z.string().regex(/^[0-9a-f]{24}$/i) }),
    input,
    revalidate: REVALIDATE,
    handler: async (data) => deleteGroup(data.id),
  });
}
