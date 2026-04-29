/**
 * Reusable startup/config helpers for CORS and cookie options.
 * Shared by API and management-api config.
 */

export type CookieSameSite = 'lax' | 'strict' | 'none';

/**
 * Options required to set or clear session/refresh cookies (names and flags).
 * Use for clearSessionCookies or when building Set-Cookie headers. Apps can extend
 * with accessExpiration/refreshExpiration for setSessionCookies.
 */
export interface SessionCookieOptions {
  sessionCookieName: string;
  refreshCookieName: string;
  cookieSecure: boolean;
  cookieSameSite: CookieSameSite;
  /**
   * When set after normalization, appended as `Domain=` on Set-Cookie for cross-subdomain auth (e.g. `.example.com`).
   * The literal hostname **`localhost`** (case-insensitive, trimmed) is treated as unset: omit `Domain` for host-only cookies on `npm run dev:all`.
   */
  cookieDomain?: string;
}

/**
 * Returns the cookie `Domain` value to use in `Set-Cookie`, or `undefined` to omit `Domain` (host-only cookie).
 * Empty, whitespace-only, and **`localhost`** yield `undefined` so browsers do not receive a misleading `Domain=` on local dev.
 */
export function effectiveCookieDomainForSetCookie(
  cookieDomain: string | undefined
): string | undefined {
  if (cookieDomain === undefined) return undefined;
  const t = cookieDomain.trim();
  if (t === '') return undefined;
  if (t.toLowerCase() === 'localhost') return undefined;
  return t;
}

const COOKIE_SAME_SITE_VALUES: CookieSameSite[] = ['lax', 'strict', 'none'];

/**
 * Parses a comma-separated CORS origins string. Returns undefined when raw is
 * missing or empty (caller may treat as "allow all").
 */
export function parseCorsOrigins(raw: string | undefined): string[] | undefined {
  if (raw === undefined || raw.trim() === '') return undefined;
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * When true, missing or empty `API_CORS_ORIGINS` / `MANAGEMENT_API_CORS_ORIGINS` must fail
 * startup. Local/dev and Vitest use `development` and `test` respectively so permissive CORS
 * remains available when the allowlist env is unset.
 */
export function corsAllowlistRequiredForCurrentNodeEnv(): boolean {
  const nodeEnv = process.env.NODE_ENV;
  return nodeEnv !== 'development' && nodeEnv !== 'test';
}

/**
 * Parses comma-separated CORS origins and enforces a non-empty allowlist outside
 * `development` / `test` so production-like deployments cannot fall back to permissive CORS.
 */
export function parseCorsOriginsWithStartupEnforcement(
  raw: string | undefined,
  envVarName: string
): string[] | undefined {
  const parsed = parseCorsOrigins(raw);
  if (!corsAllowlistRequiredForCurrentNodeEnv()) {
    return parsed;
  }
  if (parsed === undefined || parsed.length === 0) {
    throw new Error(
      `${envVarName} must be set to a non-empty comma-separated list of allowed browser origins (for example https://app.example.com,https://admin.example.com). Required when NODE_ENV is not "development" or "test".`
    );
  }
  return parsed;
}

/**
 * Parses and validates a Cookie SameSite value. Returns the typed value or throws.
 * @param value - The env value (e.g. from getEnv('COOKIE_SAME_SITE'))
 * @param varName - Optional env var name for the error message (e.g. 'COOKIE_SAME_SITE', 'MANAGEMENT_COOKIE_SAME_SITE')
 */
export function parseCookieSameSite(value: string, varName = 'COOKIE_SAME_SITE'): CookieSameSite {
  const normalized = value.trim().toLowerCase();
  if (COOKIE_SAME_SITE_VALUES.includes(normalized as CookieSameSite)) {
    return normalized as CookieSameSite;
  }
  throw new Error(`Invalid ${varName}: "${value}". Must be lax, strict, or none.`);
}
