'use server';

import { z } from 'zod';
import { adminAction } from '@/server/actions/_helpers';
import { createAdminUser } from '@/server/services/admin-users';

const createAdminUserSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome do administrador.').max(100),
  email: z.string().trim().min(1, 'Informe o e-mail.').email('E-mail inválido.').transform((value) => value.toLowerCase()),
  password: z.string()
    .min(8, 'A senha precisa ter ao menos 8 caracteres.')
    .max(72, 'A senha aceita no máximo 72 caracteres.')
    .regex(/[A-Za-zÀ-ÿ]/, 'Inclua ao menos uma letra.')
    .regex(/[0-9]/, 'Inclua ao menos um número.'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem.',
  path: ['confirmPassword'],
});

export async function createAdminUserAction(input: unknown) {
  return adminAction({
    schema: createAdminUserSchema,
    input,
    revalidate: ['/admin/administradores'],
    handler: ({ name, email, password }) => createAdminUser({ name, email, password }),
  });
}
