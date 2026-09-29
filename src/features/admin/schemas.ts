import { z } from 'zod';
import { KNOCKOUT_STAGES, MEDIA_TYPES } from '@/lib/types';

const objectId = z
  .string()
  .regex(/^[0-9a-f]{24}$/i, 'Selecione uma opção válida.');

/** `<input type="datetime-local">` manda `2026-10-04T19:30`; vazio vira null. */
const dateTimeLocal = z
  .string()
  .trim()
  .refine(
    (value) => value === '' || !Number.isNaN(new Date(value).getTime()),
    'Data inválida.',
  )
  .transform((value) => (value === '' ? null : new Date(value)));

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Informe o e-mail.').email('E-mail inválido.'),
  password: z.string().min(1, 'Informe a senha.'),
  returnTo: z.string().optional(),
});
export type LoginInput = z.input<typeof loginSchema>;

export const groupSchema = z.object({
  id: objectId.optional(),
  name: z.string().trim().min(1, 'Informe o nome do grupo.').max(40),
  order: z.coerce.number().int().min(0).max(99),
});
export type GroupFormInput = z.input<typeof groupSchema>;

export const teamSchema = z.object({
  id: objectId.optional(),
  name: z.string().trim().min(1, 'Informe o nome do time.').max(60),
  shortName: z
    .string()
    .trim()
    .min(2, 'A sigla precisa de ao menos 2 letras.')
    .max(5, 'A sigla aceita no máximo 5 letras.'),
  groupId: z.union([objectId, z.literal('')]).transform((v) => (v === '' ? null : v)),
  crestPublicId: z.string().trim().nullish().transform((v) => v || null),
  crestUrl: z.string().trim().nullish().transform((v) => v || null),
});
export type TeamFormInput = z.input<typeof teamSchema>;

export const groupMatchSchema = z
  .object({
    id: objectId.optional(),
    groupId: objectId,
    teamAId: objectId,
    teamBId: objectId,
    scheduledAt: dateTimeLocal,
  })
  .refine((data) => data.teamAId !== data.teamBId, {
    message: 'Escolha dois times diferentes.',
    path: ['teamBId'],
  });
export type GroupMatchFormInput = z.input<typeof groupMatchSchema>;

export const scheduleSchema = z.object({
  id: objectId,
  scheduledAt: dateTimeLocal,
});

export const finishMatchSchema = z
  .object({
    id: objectId,
    scoreA: z.coerce.number().int('Use números inteiros.').min(0).max(200),
    scoreB: z.coerce.number().int('Use números inteiros.').min(0).max(200),
  })
  .refine((data) => data.scoreA !== data.scoreB, {
    message: 'No 3x3 não existe empate.',
    path: ['scoreB'],
  });
export type FinishMatchFormInput = z.input<typeof finishMatchSchema>;

export const matchIdSchema = z.object({ id: objectId });

export const generateBracketSchema = z.object({
  entryStage: z.enum(KNOCKOUT_STAGES),
});

export const bracketSlotSchema = z.object({
  slot: z.coerce.number().int().min(1).max(8),
  teamAId: z.union([objectId, z.literal('')]).transform((v) => (v === '' ? null : v)),
  teamBId: z.union([objectId, z.literal('')]).transform((v) => (v === '' ? null : v)),
});
export type BracketSlotFormInput = z.input<typeof bracketSlotSchema>;

export const createMediaSchema = z.object({
  publicId: z.string().trim().min(1),
  url: z.string().trim().url(),
  type: z.enum(MEDIA_TYPES),
  caption: z.string().trim().max(160).nullish().transform((v) => v || null),
  width: z.coerce.number().int().positive().nullish().transform((v) => v ?? null),
  height: z.coerce.number().int().positive().nullish().transform((v) => v ?? null),
});

export const mediaCaptionSchema = z.object({
  id: objectId,
  caption: z.string().trim().max(160).nullish().transform((v) => v || null),
});

export const mediaIdSchema = z.object({ id: objectId });

export const uploadSignatureSchema = z.object({
  subfolder: z.string().trim().max(40).optional(),
});
