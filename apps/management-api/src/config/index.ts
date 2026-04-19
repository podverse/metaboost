import type {
  AuthModeCapabilities as SharedAuthModeCapabilities,
  AuthModeValue,
} from '@metaboost/helpers';

import {
  getAuthModeCapabilities as getSharedAuthModeCapabilities,
  normalizeVersionPath,
  parseAuthModeOrThrow,
  parseCorsOrigins,
} from '@metaboost/helpers';

const getEnv = (key: string): string => {
  const value = process.env[key];
  if (value === undefined || value === null || value === '') {
    throw new Error(`Missing required env: ${key}`);
  }
  return value;
};

const getEnvOptional = (key: string): string | undefined =>
  process.env[key] === undefined || process.env[key] === '' ? undefined : process.env[key];

const getEnvOptionalTrimmed = (key: string): string | undefined => {
  const v = getEnvOptional(key);
  if (v === undefined) {
    return undefined;
  }
  const t = v.trim();
  return t === '' ? undefined : t;
};

export type AuthMode = AuthModeValue;
export type AuthModeCapabilities = SharedAuthModeCapabilities;

const parseAuthMode = (value: string): AuthMode => parseAuthModeOrThrow(value);

export const getAuthModeCapabilities = (authMode: AuthMode): AuthModeCapabilities => {
  return getSharedAuthModeCapabilities(authMode);
};

const authMode = parseAuthMode(getEnv('AUTH_MODE'));
const authModeCapabilities = getAuthModeCapabilities(authMode);

export const config = {
  authMode,
  authModeCapabilities,
  port: Number.parseInt(getEnv('MANAGEMENT_API_PORT'), 10),
  /** Outbound HTTP User-Agent (required; set in classification / env). */
  userAgent: getEnv('MANAGEMENT_API_USER_AGENT'),
  jwtSecret: getEnv('MANAGEMENT_API_JWT_SECRET'),
  apiVersionPath: normalizeVersionPath(getEnvOptional('MANAGEMENT_API_VERSION_PATH') ?? 'v1'),
  /** Access token expiry in seconds (JWT and cookie max-age). Required; e.g. 900 = 15m. */
  accessTokenMaxAgeSeconds: Number.parseInt(getEnv('MANAGEMENT_API_JWT_ACCESS_EXPIRY_SECONDS'), 10),
  refreshTokenMaxAgeSeconds: Number.parseInt(
    getEnv('MANAGEMENT_API_JWT_REFRESH_EXPIRY_SECONDS'),
    10
  ),
  sessionCookieName: getEnv('MANAGEMENT_API_SESSION_COOKIE_NAME'),
  refreshCookieName: getEnv('MANAGEMENT_API_REFRESH_COOKIE_NAME'),
  corsOrigins: parseCorsOrigins(getEnvOptional('MANAGEMENT_API_CORS_ORIGINS')),
  cookieSecure: process.env.NODE_ENV === 'production',
  /** SameSite is fixed to `lax` (not configurable via env). */
  cookieSameSite: 'lax' as const,
  /** Optional Set-Cookie Domain (parallel to API_COOKIE_DOMAIN on main API; e.g. `.example.com`). */
  cookieDomain: getEnvOptionalTrimmed('MANAGEMENT_API_COOKIE_DOMAIN'),
  /** Invitation/set-password link expiry in hours for admin-created users. */
  userInvitationTtlHours: Number.parseInt(getEnv('MANAGEMENT_API_USER_INVITATION_TTL_HOURS'), 10),
  /** Main web app base URL (optional). Used to build invitation/set-password links. */
  webAppUrl: getEnvOptional('WEB_BASE_URL'),
};
