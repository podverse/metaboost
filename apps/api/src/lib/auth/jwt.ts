import type { UserWithRelations } from '@metaboost/orm';

import jwt, { type SignOptions } from 'jsonwebtoken';

import { isValidNanoIdV2IdText } from '@metaboost/helpers';

export interface JwtPayload {
  sub: string;
  /** Public stable id; must match `User.idText` (nano_id_v2; 9–15 chars). */
  id_text: string;
  email?: string | null;
  username?: string | null;
}

function baseClaims(user: UserWithRelations): Record<string, unknown> {
  return {
    sub: user.id,
    id_text: user.idText,
    email: user.credentials.email ?? null,
    username: user.credentials.username ?? null,
  };
}

/** Sign a JWT. Caller must pass expiration from config (e.g. config.accessTokenExpiration). */
export function signToken(user: UserWithRelations, secret: string, expiration: number): string {
  const options = { expiresIn: expiration } as SignOptions;
  return jwt.sign(baseClaims(user) as jwt.JwtPayload, secret, options);
}

/** Short-lived access token for cookie/Bearer auth. Expiry in seconds (from config.accessTokenExpiration). */
export function signAccessToken(
  user: UserWithRelations,
  secret: string,
  expiration: number
): string {
  const options = { expiresIn: expiration } as SignOptions;
  return jwt.sign(baseClaims(user) as jwt.JwtPayload, secret, options);
}

export function verifyToken(token: string, secret: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    if (
      decoded === null ||
      typeof decoded.sub !== 'string' ||
      typeof decoded.id_text !== 'string' ||
      !isValidNanoIdV2IdText(decoded.id_text)
    ) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}
