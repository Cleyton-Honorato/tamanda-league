import 'server-only';
import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';
import type { ZodType, z } from 'zod';
import { DomainError } from '@/server/errors';
import { getAdminSession, type AdminSession } from '@/server/auth/session';
import { failure, success, type ActionResult } from '@/lib/result';
import { toFieldErrors } from '@/lib/validation';

/**
 * Traduz uma exceção em `ActionResult`. Controle de fluxo do Next
 * (`redirect`/`notFound`) é relançado — engoli-lo aqui quebraria a navegação.
 */
function toFailure<T>(error: unknown): ActionResult<T> {
  unstable_rethrow(error);

  if (error instanceof DomainError) {
    return failure<T>(
      error.message,
      'DOMAIN',
      error.field ? { [error.field]: error.message } : undefined,
    );
  }

  console.error('[action] erro não tratado:', error);
  return failure<T>('Algo deu errado. Tente novamente.', 'UNKNOWN');
}

/**
 * Mutação do painel: sessão → validação → regra → revalidação das páginas
 * públicas afetadas.
 *
 * A sessão é conferida aqui porque uma server action é um POST comum: o guard
 * do `proxy.ts` não protege a chamada direta.
 */
export async function adminAction<S extends ZodType, T>(options: {
  schema: S;
  input: unknown;
  handler: (data: z.infer<S>, admin: AdminSession) => Promise<T>;
  revalidate?: readonly string[];
}): Promise<ActionResult<T>> {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return failure<T>('Sessão expirada. Entre novamente.', 'UNAUTHENTICATED');
    }

    const parsed = options.schema.safeParse(options.input);
    if (!parsed.success) {
      return failure<T>(
        'Verifique os campos destacados.',
        'VALIDATION',
        toFieldErrors(parsed.error),
      );
    }

    const data = await options.handler(parsed.data, admin);

    for (const path of options.revalidate ?? []) {
      revalidatePath(path);
    }

    return success(data);
  } catch (error) {
    return toFailure<T>(error);
  }
}

/** Variante sem sessão — só para o login. */
export async function publicAction<S extends ZodType, T>(options: {
  schema: S;
  input: unknown;
  handler: (data: z.infer<S>) => Promise<T>;
}): Promise<ActionResult<T>> {
  try {
    const parsed = options.schema.safeParse(options.input);
    if (!parsed.success) {
      return failure<T>(
        'Verifique os campos destacados.',
        'VALIDATION',
        toFieldErrors(parsed.error),
      );
    }

    return success(await options.handler(parsed.data));
  } catch (error) {
    return toFailure<T>(error);
  }
}
