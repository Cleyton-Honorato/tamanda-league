'use server';

import { z } from 'zod';
import { adminAction } from '@/server/actions/_helpers';
import { deleteAthlete, saveAthlete } from '@/server/services/athletes';

const athleteSchema = z.object({
  id: z.string().regex(/^[0-9a-f]{24}$/i).optional(),
  name: z.string().trim().min(2, 'Informe o nome do atleta.').max(100),
  nickname: z.string().trim().max(50).nullish().transform((value) => value || null),
});

export async function saveAthleteAction(input: unknown) {
  return adminAction({
    schema: athleteSchema,
    input,
    revalidate: ['/admin/atletas', '/admin'],
    handler: (data) => saveAthlete(data),
  });
}

export async function deleteAthleteAction(input: unknown) {
  return adminAction({
    schema: z.object({ id: z.string().regex(/^[0-9a-f]{24}$/i) }),
    input,
    revalidate: ['/admin/atletas', '/admin'],
    handler: (data) => deleteAthlete(data.id),
  });
}
