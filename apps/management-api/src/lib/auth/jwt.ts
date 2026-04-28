import type { ManagementUser } from '@metaboost/management-orm';

import { isValidManagementJwtIdText } from '@metaboost/helpers';

import jwt, { type SignOptions, type VerifyOptions } from 'jsonwebtoken';

/**
 * JWT payload: `sub` loads the user; `id_text` must match `ManagementUserCredentials.username` (Podverse-alignment: bind session to id + id_text).
 * isSuperAdmin comes from the loaded user, not the token.
 */
export interface ManagementJwtPayload {
  sub: string;
  id_text: string;
}

export type ManagementJwtClaimOptions = {
  issuer?: string;
  audience?: string;
};

export function resolveManagementJwtClaimOptions(
  issuer: string | undefined,
  audience: string | undefined
): ManagementJwtClaimOptions | undefined {
  const i = issuer?.trim();
  const a = audience?.trim();
  const hasI = i !== undefined && i !== '';
  const hasA = a !== undefined && a !== '';
  if (!hasI && !hasA) {
    return undefined;
  }
  return { issuer: hasI ? i : undefined, audience: hasA ? a : undefined };
}

function claimsPayload(
  user: ManagementUser,
  claimOptions: ManagementJwtClaimOptions | undefined
): Record<string, unknown> {
  const out: Record<string, unknown> = {
    sub: user.id,
    id_text: user.credentials.username,
  };
  if (claimOptions?.issuer !== undefined && claimOptions.issuer !== '') {
    out.iss = claimOptions.issuer;
  }
  if (claimOptions?.audience !== undefined && claimOptions.audience !== '') {
    out.aud = claimOptions.audience;
  }
  return out;
}

/** Sign a JWT. Caller must pass expiresIn (seconds or string e.g. "7d"). */
export function signManagementToken(
  user: ManagementUser,
  secret: string,
  expiresIn: number | string,
  claimOptions?: ManagementJwtClaimOptions
): string {
  const options = { expiresIn } as SignOptions;
  return jwt.sign(claimsPayload(user, claimOptions) as jwt.JwtPayload, secret, options);
}

export function verifyManagementToken(
  token: string,
  secret: string,
  claimOptions?: ManagementJwtClaimOptions
): ManagementJwtPayload | null {
  try {
    const verifyOpts: VerifyOptions = {};
    if (claimOptions?.audience !== undefined && claimOptions.audience !== '') {
      verifyOpts.audience = claimOptions.audience;
    }
    if (claimOptions?.issuer !== undefined && claimOptions.issuer !== '') {
      verifyOpts.issuer = claimOptions.issuer;
    }
    const decoded = jwt.verify(token, secret, verifyOpts) as ManagementJwtPayload;
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

/** Short-lived access token for cookie/Bearer auth. Expiry in seconds (from config.accessTokenMaxAgeSeconds). */
export function signManagementAccessToken(
  user: ManagementUser,
  secret: string,
  expiresInSeconds: number,
  claimOptions?: ManagementJwtClaimOptions
): string {
  const options = { expiresIn: expiresInSeconds } as SignOptions;
  return jwt.sign(claimsPayload(user, claimOptions) as jwt.JwtPayload, secret, options);
}
