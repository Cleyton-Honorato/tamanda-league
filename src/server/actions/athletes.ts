'use server';

import { z } from 'zod';
import { adminAction } from '@/server/actions/_helpers';
import { deleteAthlete, saveAthlete, setAthleteLevel } from '@/server/services/athletes';

const athleteLevelSchema = z.number().min(0.5).max(5).refine((value) => Number.isInteger(value * 2), 'Use intervalos de meia estrela.');

const athleteSchema = z.object({
  id: z.string().regex(/^[0-9a-f]{24}$/i).optional(),
  name: z.string().trim().min(2, 'Informe o nome do atleta.').max(100),
  nickname: z.string().trim().max(50).nullish().transform((value) => value || null),
  level: z.union([athleteLevelSchema, z.null()]),
  teamId: z.union([z.string().regex(/^[0-9a-f]{24}$/i), z.null()]),
});

export async function saveAthleteAction(input: unknown) {
  return adminAction({
    schema: athleteSchema,
    input,
    revalidate: ['/admin/atletas', '/admin/times', '/admin'],
    handler: (data) => saveAthlete(data),
  });
}

export async function deleteAthleteAction(input: unknown) {
  return adminAction({
    schema: z.object({ id: z.string().regex(/^[0-9a-f]{24}$/i) }),
    input,
    revalidate: ['/admin/atletas', '/admin/times', '/admin'],
    handler: (data) => deleteAthlete(data.id),
  });
}

export async function setAthleteLevelAction(input: unknown) {
  return adminAction({
    schema: z.object({
      id: z.string().regex(/^[0-9a-f]{24}$/i),
      level: athleteLevelSchema,
    }),
    input,
    revalidate: ['/admin/atletas', '/admin/times'],
    handler: (data) => setAthleteLevel(data.id, data.level),
  });
}
