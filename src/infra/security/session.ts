import { cookies } from 'next/headers';
import { signSession, verifySession, type SessionClaims } from './jwt';

const COOKIE_NAME = 'session';

export type SessionData = Omit<SessionClaims, 'iat' | 'exp'>;

export async function createSession(
  data: SessionData,
  opts: { remember?: boolean; hours?: number } = {},
) {
  const token = await signSession(data, { hours: opts.remember ? 24 * 30 : opts.hours });
  const jar = await cookies();
  const maxAge = opts.remember ? 60 * 60 * 24 * 30 : undefined; // 30d
  const isProd = process.env.NODE_ENV === 'production';
  jar.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    ...(maxAge ? { maxAge } : {}),
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifySession(token);
}
