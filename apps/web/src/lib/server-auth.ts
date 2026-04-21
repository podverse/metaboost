import 'server-only';
import { cookies, headers } from 'next/headers';

import { request } from '@metaboost/helpers-requests';

import { getServerApiBaseUrl } from '../config/env';
import { parseAuthEnvelope, parseAuthUserHeaderJson, type AuthUserPayload } from './auth-user';

export type ServerUser = AuthUserPayload;

const AUTH_USER_HEADER = 'x-auth-user';

async function requestAuthUser(
  baseUrl: string,
  cookieHeader: string,
  acceptLanguage: string | null
) {
  const headers: Record<string, string> = { Cookie: cookieHeader };
  if (acceptLanguage !== null && acceptLanguage !== '') {
    headers['Accept-Language'] = acceptLanguage;
  }
  return request<{ user?: ServerUser }>(baseUrl, '/auth/me', {
    headers,
    cache: 'no-store',
  });
}

/**
 * Read auth user from middleware-injected header only.
 * Protected routes should use this path to avoid transient API fetch races.
 */
export async function getServerUserFromHeader(): Promise<ServerUser | null> {
  const headerStore = await headers();
  return parseAuthUserHeaderJson(headerStore.get(AUTH_USER_HEADER));
}

/**
 * Get the current user from the API server-side.
 * Prefers x-auth-user header when set by middleware (after SSR session restore).
 * Otherwise forwards cookies from the incoming request to the API.
 * Returns null if not authenticated.
 */
export async function getServerUser(): Promise<ServerUser | null> {
  const fromHeader = await getServerUserFromHeader();
  if (fromHeader !== null) {
    return fromHeader;
  }

  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  if (cookieHeader === '') {
    return null;
  }

  const baseUrl = getServerApiBaseUrl();
  const headerStore = await headers();
  const acceptLanguage = headerStore.get('accept-language');
  let authUserResponse: Awaited<ReturnType<typeof requestAuthUser>>;
  try {
    authUserResponse = await requestAuthUser(baseUrl, cookieHeader, acceptLanguage);
  } catch {
    return null;
  }

  if (!authUserResponse.ok || authUserResponse.data === undefined) {
    return null;
  }
  return parseAuthEnvelope(authUserResponse.data);
}
