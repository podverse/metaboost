import type { ManagementUser } from '@metaboost/management-orm';

import jwt, { type SignOptions } from 'jsonwebtoken';

import { isValidManagementJwtIdText } from '@metaboost/helpers';

/**
 * JWT payload: `sub` loads the user; `id_text` must match `ManagementUserCredentials.username` (Podverse-alignment: bind session to id + id_text).
 * isSuperAdmin comes from the loaded user, not the token.
 */
export interface ManagementJwtPayload {
  sub: string;
  id_text: string;
}
function claimsPayload(user: ManagementUser): Record<string, unknown> {
  return {
    sub: user.id,
    id_text: user.credentials.username,
  };
}

/** Sign a JWT. Caller must pass expiresIn (seconds or string e.g. "7d"). */
export function signManagementToken(
  user: ManagementUser,
  secret: string,
  expiresIn: number | string
): string {
  const options = { expiresIn } as SignOptions;
  return jwt.sign(claimsPayload(user) as jwt.JwtPayload, secret, options);
}

export function verifyManagementToken(token: string, secret: string): ManagementJwtPayload | null {
  try {
    const decoded = jwt.verify(token, secret) as ManagementJwtPayload;
    if (
      decoded === null ||
      typeof decoded.sub !== 'string' ||
      typeof decoded.id_text !== 'string' ||
      !isValidManagementJwtIdText(decoded.id_text)
    ) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

/** Short-lived access token for cookie/Bearer auth. Expiry in seconds (from config.accessTokenExpiration). */
export function signManagementAccessToken(
  user: ManagementUser,
  secret: string,
  expiration: number
): string {
  const options = { expiresIn: expiration } as SignOptions;
  return jwt.sign(claimsPayload(user) as jwt.JwtPayload, secret, options);
}
