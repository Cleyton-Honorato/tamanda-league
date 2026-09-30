'use server';

import { redirect } from 'next/navigation';
import { dbConnect } from '@/server/db';
import { DomainError } from '@/server/errors';
import { AdminUser } from '@/server/models/admin-user';
import { verifyPassword } from '@/server/auth/password';
import { createSession, destroySession } from '@/server/auth/session';
import { publicAction } from '@/server/actions/_helpers';
import { loginSchema } from '@/features/admin/schemas';
import { ROUTES } from '@/lib/constants';
import type { ActionResult } from '@/lib/result';

/** Só aceita caminho interno — `//host` seria um redirect para fora. */
function safeReturnTo(value: string | undefined): string {
  if (!value) return ROUTES.admin;
  if (!value.startsWith('/') || value.startsWith('//')) return ROUTES.admin;
  return value;
}

export async function loginAction(
  input: unknown,
): Promise<ActionResult<never>> {
  const result = await publicAction({
    schema: loginSchema,
    input,
    handler: async (data) => {
      const connection = await dbConnect();

      const admin = await AdminUser.findOne({
        email: data.email.toLowerCase(),
      }).lean();

      // Mensagem única para e-mail inexistente e senha errada: não confirma
      // quais e-mails existem.
      const invalid = new DomainError('E-mail ou senha incorretos.');
      if (!admin) {
        console.warn('[auth] login recusado', {
          reason: 'admin-not-found',
          database: connection.connection.db?.databaseName,
          host: connection.connection.host,
        });
        throw invalid;
      }

      const matches = await verifyPassword(data.password, admin.passwordHash);
      if (!matches) {
        console.warn('[auth] login recusado', {
          reason: 'password-mismatch',
          database: connection.connection.db?.databaseName,
          host: connection.connection.host,
        });
        throw invalid;
      }

      await createSession({
        userId: admin._id.toString(),
        email: admin.email,
        name: admin.name,
      });

      return safeReturnTo(data.returnTo);
    },
  });

  // `redirect` lança para interromper o fluxo, então fica fora do pipeline
  // que captura exceções.
  if (result.ok) redirect(result.data);
  return result as ActionResult<never>;
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect(ROUTES.adminLogin);
}
