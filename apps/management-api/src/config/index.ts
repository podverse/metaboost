import type {
  AccountSignupModeCapabilities as SharedAccountSignupModeCapabilities,
  AccountSignupModeValue,
} from '@metaboost/helpers';

import {
  getAccountSignupModeCapabilities as getSharedAccountSignupModeCapabilities,
  normalizeVersionPath,
  parseAccountSignupModeOrThrow,
  parseCorsOriginsWithStartupEnforcement,
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

export type AccountSignupMode = AccountSignupModeValue;
export type AccountSignupModeCapabilities = SharedAccountSignupModeCapabilities;

const parseAccountSignupMode = (value: string): AccountSignupMode =>
  parseAccountSignupModeOrThrow(value);

export const getAccountSignupModeCapabilities = (
  accountSignupMode: AccountSignupMode
): AccountSignupModeCapabilities => {
  return getSharedAccountSignupModeCapabilities(accountSignupMode);
};

const accountSignupMode = parseAccountSignupMode(getEnv('ACCOUNT_SIGNUP_MODE'));
const accountSignupModeCapabilities = getAccountSignupModeCapabilities(accountSignupMode);

export const config = {
  accountSignupMode,
  accountSignupModeCapabilities,
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
  /**
   * Optional JWT `iss` / `aud` for management access tokens. When set, new tokens include these claims
   * and verification requires them (leave unset until all clients rotate).
   */
  jwtIssuer: getEnvOptionalTrimmed('MANAGEMENT_API_JWT_ISSUER'),
  jwtAudience: getEnvOptionalTrimmed('MANAGEMENT_API_JWT_AUDIENCE'),
  sessionCookieName: getEnv('MANAGEMENT_API_SESSION_COOKIE_NAME'),
  refreshCookieName: getEnv('MANAGEMENT_API_REFRESH_COOKIE_NAME'),
  corsOrigins: parseCorsOriginsWithStartupEnforcement(
    getEnvOptional('MANAGEMENT_API_CORS_ORIGINS'),
    'MANAGEMENT_API_CORS_ORIGINS'
  ),
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
