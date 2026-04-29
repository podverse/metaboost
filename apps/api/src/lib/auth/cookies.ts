import type { SessionCookieOptions } from '@metaboost/helpers';
import type { Response } from 'express';

import { effectiveCookieDomainForSetCookie } from '@metaboost/helpers';

export interface CookieOptions extends SessionCookieOptions {
  accessExpiration: number;
  refreshExpiration: number;
}

function domainAttribute(cookieDomain: string | undefined): string {
  const d = effectiveCookieDomainForSetCookie(cookieDomain);
  if (d === undefined || d === '') {
    return '';
  }
  return `; Domain=${d}`;
}

/**
 * Set HTTP-only session (access) and refresh cookies. Never send tokens in response body for browser clients.
 */
export function setSessionCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
  options: CookieOptions
): void {
  const sameSite = options.cookieSameSite;
  const secure = options.cookieSecure;
  const domain = domainAttribute(options.cookieDomain);
  const sessionOpts = `Path=/; Max-Age=${options.accessExpiration}; HttpOnly; SameSite=${sameSite}${secure ? '; Secure' : ''}${domain}`;
  const refreshOpts = `Path=/; Max-Age=${options.refreshExpiration}; HttpOnly; SameSite=${sameSite}${secure ? '; Secure' : ''}${domain}`;
  res.setHeader('Set-Cookie', [
    `${options.sessionCookieName}=${encodeURIComponent(accessToken)}; ${sessionOpts}`,
    `${options.refreshCookieName}=${encodeURIComponent(refreshToken)}; ${refreshOpts}`,
  ]);
}

/**
 * Clear session and refresh cookies (e.g. on logout or invalid refresh).
 */
export function clearSessionCookies(res: Response, options: SessionCookieOptions): void {
  const sameSite = options.cookieSameSite;
  const secure = options.cookieSecure;
  const domain = domainAttribute(options.cookieDomain);
  const clearOpts = `Path=/; Max-Age=0; HttpOnly; SameSite=${sameSite}${secure ? '; Secure' : ''}${domain}`;
  res.setHeader('Set-Cookie', [
    `${options.sessionCookieName}=; ${clearOpts}`,
    `${options.refreshCookieName}=; ${clearOpts}`,
  ]);
}
