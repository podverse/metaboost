import type { UserWithRelations } from '@metaboost/orm';

import jwt, { type SignOptions, type VerifyOptions } from 'jsonwebtoken';

export interface JwtPayload {
  sub: string;
  email?: string | null;
  username?: string | null;
}

export type JwtClaimOptions = {
  issuer?: string;
  audience?: string;
};

/** Build sign/verify options when `API_JWT_ISSUER` / `API_JWT_AUDIENCE` are configured. */
export function resolveJwtClaimOptions(
  issuer: string | undefined,
  audience: string | undefined
): JwtClaimOptions | undefined {
  const i = issuer?.trim();
  const a = audience?.trim();
  const hasI = i !== undefined && i !== '';
  const hasA = a !== undefined && a !== '';
  if (!hasI && !hasA) {
    return undefined;
  }
  return { issuer: hasI ? i : undefined, audience: hasA ? a : undefined };
}

function baseClaims(user: UserWithRelations): Record<string, unknown> {
  return {
    sub: user.id,
    email: user.credentials.email ?? null,
    username: user.credentials.username ?? null,
  };
}

function claimsWithOptionalIssAud(
  user: UserWithRelations,
  claimOptions: JwtClaimOptions | undefined
): Record<string, unknown> {
  const out = baseClaims(user);
  if (claimOptions?.issuer !== undefined && claimOptions.issuer !== '') {
    out.iss = claimOptions.issuer;
  }
  if (claimOptions?.audience !== undefined && claimOptions.audience !== '') {
    out.aud = claimOptions.audience;
  }
  return out;
}

/** Sign a JWT. Caller must pass expiresInSeconds from config (e.g. config.accessTokenMaxAgeSeconds). */
export function signToken(
  user: UserWithRelations,
  secret: string,
  expiresInSeconds: number,
  claimOptions?: JwtClaimOptions
): string {
  const options = { expiresIn: expiresInSeconds } as SignOptions;
  return jwt.sign(claimsWithOptionalIssAud(user, claimOptions) as jwt.JwtPayload, secret, options);
}

/** Short-lived access token for cookie/Bearer auth. Expiry in seconds (from config.accessTokenMaxAgeSeconds). */
export function signAccessToken(
  user: UserWithRelations,
  secret: string,
  expiresInSeconds: number,
  claimOptions?: JwtClaimOptions
): string {
  const options = { expiresIn: expiresInSeconds } as SignOptions;
  return jwt.sign(claimsWithOptionalIssAud(user, claimOptions) as jwt.JwtPayload, secret, options);
}

export function verifyToken(
  token: string,
  secret: string,
  claimOptions?: JwtClaimOptions
): JwtPayload | null {
  try {
    const verifyOpts: VerifyOptions = {};
    if (claimOptions?.audience !== undefined && claimOptions.audience !== '') {
      verifyOpts.audience = claimOptions.audience;
    }
    if (claimOptions?.issuer !== undefined && claimOptions.issuer !== '') {
      verifyOpts.issuer = claimOptions.issuer;
    }
    const decoded = jwt.verify(token, secret, verifyOpts) as JwtPayload;
    return decoded !== null && typeof decoded.sub === 'string' ? decoded : null;
  } catch {
    return null;
  }
}
