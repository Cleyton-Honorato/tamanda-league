'use server';

import { z } from 'zod';
import { adminAction } from '@/server/actions/_helpers';
import { teamSchema } from '@/features/admin/schemas';
import { createTeam, deleteTeam, updateTeam } from '@/server/services/teams';
import { PUBLIC_MATCH_PATHS } from '@/lib/constants';

const REVALIDATE = [...PUBLIC_MATCH_PATHS, '/admin/times'];

export async function saveTeamAction(input: unknown) {
  return adminAction({
    schema: teamSchema,
    input,
    revalidate: REVALIDATE,
    handler: async (data) => {
      const payload = {
        name: data.name,
        shortName: data.shortName.toUpperCase(),
        groupId: data.groupId,
        crestPublicId: data.crestPublicId,
        crestUrl: data.crestUrl,
      };
      return data.id ? updateTeam(data.id, payload) : createTeam(payload);
    },
  });
}

export async function deleteTeamAction(input: unknown) {
  return adminAction({
    schema: z.object({ id: z.string().regex(/^[0-9a-f]{24}$/i) }),
    input,
    revalidate: REVALIDATE,
    handler: async (data) => deleteTeam(data.id),
  });
}
