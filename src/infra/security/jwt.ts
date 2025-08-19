import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

const DEFAULT_EXP_HOURS = 8;

function getSecret() {
  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || '';
  if (!secret) throw new Error('JWT secret is not set (JWT_SECRET or NEXTAUTH_SECRET)');
  return new TextEncoder().encode(secret);
}

export type SessionClaims = JWTPayload & {
  userId: string;
  username: string;
  role?: string;
};

export async function signSession(claims: Omit<SessionClaims, 'iat' | 'exp'>, opts?: { hours?: number }) {
  const secret = getSecret();
  const hours = opts?.hours ?? DEFAULT_EXP_HOURS;
  const exp = Math.floor(Date.now() / 1000) + hours * 60 * 60;
  return await new SignJWT({ ...claims })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(secret);
}

export async function verifySession(token: string): Promise<SessionClaims | null> {
  try {
    const secret = getSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload as SessionClaims;
  } catch {
    return null;
  }
}
