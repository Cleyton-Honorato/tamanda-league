import { jwtVerify, SignJWT, type JWTPayload } from 'jose';

/**
 * Sessão do admin assinada com `jose`.
 *
 * Sem `server-only` de propósito: o `proxy.ts` também importa este módulo.
 * Ainda assim nunca chega ao bundle do client — só código de servidor o usa.
 */

const ALG = 'HS256';

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 dias

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET não configurada — defina em .env.local');
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  /** `_id` do AdminUser em hexadecimal. */
  userId: string;
  email: string;
  name: string;
}

export async function signSessionToken(
  payload: SessionPayload,
): Promise<string> {
  return new SignJWT({ email: payload.email, name: payload.name })
    .setProtectedHeader({ alg: ALG })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: [ALG],
    });
    return toSessionPayload(payload);
  } catch {
    return null;
  }
}

const OBJECT_ID_PATTERN = /^[0-9a-f]{24}$/i;

function toSessionPayload(payload: JWTPayload): SessionPayload | null {
  const userId = payload.sub;
  const { email, name } = payload as { email?: unknown; name?: unknown };

  if (typeof userId !== 'string' || !OBJECT_ID_PATTERN.test(userId)) return null;
  if (typeof email !== 'string' || typeof name !== 'string') return null;

  return { userId, email, name };
}
