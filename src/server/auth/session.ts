import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { COOKIES, ROUTES } from '@/lib/constants';
import {
  SESSION_MAX_AGE_SECONDS,
  signSessionToken,
  verifySessionToken,
  type SessionPayload,
} from '@/server/auth/jwt';

export type AdminSession = SessionPayload;

export async function createSession(admin: AdminSession): Promise<void> {
  const token = await signSessionToken(admin);
  (await cookies()).set(COOKIES.SESSION, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(COOKIES.SESSION);
}

/** Sessão atual, ou null. Não redireciona. */
export async function getAdminSession(): Promise<AdminSession | null> {
  const token = (await cookies()).get(COOKIES.SESSION)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Sessão obrigatória — a autoridade real do controle de acesso.
 *
 * O `proxy.ts` só evita pintar uma tela que seria negada; toda página e toda
 * action do admin passa por aqui. Isso importa porque server actions são
 * simples POSTs, alcançáveis fora da UI.
 */
export async function requireAdmin(): Promise<AdminSession> {
  const admin = await getAdminSession();
  if (!admin) redirect(ROUTES.adminLogin);
  return admin;
}
