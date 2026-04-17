/**
 * JWT payload claims for `Authorization: AppAssertion <jwt>` on `POST /v1/s/*`.
 * Align with docs/api/S-ENDPOINT-APP-SIGNING.md (verifier in apps/api must match).
 */
export type AppAssertionClaims = {
  iss: string;
  iat: number;
  exp: number;
  jti: string;
  m: 'POST';
  p: string;
  bh: string;
  app_ver?: string;
};

/** Maximum `exp - iat` in seconds per signing spec. */
export const APP_ASSERTION_MAX_TTL_SECONDS = 300;
