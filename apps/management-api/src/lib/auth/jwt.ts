import type { ManagementUser } from '@boilerplate/management-orm';

import jwt, { type SignOptions } from 'jsonwebtoken';

/** JWT payload: sub is used to load the management user from DB; isSuperAdmin comes from the loaded user, not the token. */
export interface ManagementJwtPayload {
  sub: string;
  username: string;
}

/** Sign a JWT. Caller must pass expiresIn (seconds or string e.g. "7d"). */
export function signManagementToken(
  user: ManagementUser,
  secret: string,
  expiresIn: number | string
): string {
  const options = { expiresIn } as SignOptions;
  return jwt.sign(
    { sub: user.id, username: user.credentials.username } as ManagementJwtPayload,
    secret,
    options
  );
}

export function verifyManagementToken(token: string, secret: string): ManagementJwtPayload | null {
  try {
    const decoded = jwt.verify(token, secret) as ManagementJwtPayload;
    return decoded !== null &&
      typeof decoded.sub === 'string' &&
      typeof decoded.username === 'string'
      ? decoded
      : null;
  } catch {
    return null;
  }
}

/** Short-lived access token for cookie/Bearer auth. Expiry in seconds (from config.accessTokenMaxAgeSeconds). */
export function signManagementAccessToken(
  user: ManagementUser,
  secret: string,
  expiresInSeconds: number
): string {
  const options = { expiresIn: expiresInSeconds } as SignOptions;
  return jwt.sign(
    { sub: user.id, username: user.credentials.username } as ManagementJwtPayload,
    secret,
    options
  );
}
