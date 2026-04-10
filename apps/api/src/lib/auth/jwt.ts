import type { UserWithRelations } from '@metaboost/orm';

import jwt, { type SignOptions } from 'jsonwebtoken';

export interface JwtPayload {
  sub: string;
  email?: string | null;
  username?: string | null;
}

/** Sign a JWT. Caller must pass expiresInSeconds from config (e.g. config.accessTokenMaxAgeSeconds). */
export function signToken(
  user: UserWithRelations,
  secret: string,
  expiresInSeconds: number
): string {
  const options = { expiresIn: expiresInSeconds } as SignOptions;
  return jwt.sign(
    {
      sub: user.id,
      email: user.credentials.email ?? null,
      username: user.credentials.username ?? null,
    } as JwtPayload,
    secret,
    options
  );
}

/** Short-lived access token for cookie/Bearer auth. Expiry in seconds (from config.accessTokenMaxAgeSeconds). */
export function signAccessToken(
  user: UserWithRelations,
  secret: string,
  expiresInSeconds: number
): string {
  const options = { expiresIn: expiresInSeconds } as SignOptions;
  return jwt.sign(
    {
      sub: user.id,
      email: user.credentials.email ?? null,
      username: user.credentials.username ?? null,
    } as JwtPayload,
    secret,
    options
  );
}

export function verifyToken(token: string, secret: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    return decoded !== null && typeof decoded.sub === 'string' ? decoded : null;
  } catch {
    return null;
  }
}
