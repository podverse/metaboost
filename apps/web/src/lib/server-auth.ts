import 'server-only';
import { cookies, headers } from 'next/headers';

import { request } from '@metaboost/helpers-requests';

import { getServerApiBaseUrl } from '../config/env';

export type ServerUser = {
  id: string;
  shortId: string;
  email: string | null;
  username: string | null;
  displayName: string | null;
  preferredCurrency: string | null;
};

const AUTH_USER_HEADER = 'x-auth-user';

async function requestAuthUser(baseUrl: string, cookieHeader: string) {
  return request<{ user?: ServerUser }>(baseUrl, '/auth/me', {
    headers: { Cookie: cookieHeader },
    cache: 'no-store',
  });
}

function parseAuthUserHeader(value: string | null): ServerUser | null {
  if (value === null || value === '') return null;
  try {
    const parsed = JSON.parse(value) as {
      id?: string;
      shortId?: string;
      email?: string | null;
      username?: string | null;
      displayName?: string | null;
      preferredCurrency?: string | null;
    };
    if (typeof parsed.id !== 'string') return null;
    const hasEmail = parsed.email !== undefined && parsed.email !== null && parsed.email !== '';
    const hasUsername =
      parsed.username !== undefined && parsed.username !== null && parsed.username !== '';
    if (!hasEmail && !hasUsername) return null;
    return {
      id: parsed.id,
      shortId: typeof parsed.shortId === 'string' ? parsed.shortId : parsed.id,
      email: hasEmail ? (parsed.email as string) : null,
      username: hasUsername ? (parsed.username as string) : null,
      displayName: parsed.displayName ?? null,
      preferredCurrency: parsed.preferredCurrency ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Read auth user from middleware-injected header only.
 * Protected routes should use this path to avoid transient API fetch races.
 */
export async function getServerUserFromHeader(): Promise<ServerUser | null> {
  const headerStore = await headers();
  return parseAuthUserHeader(headerStore.get(AUTH_USER_HEADER));
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
  let authUserResponse: Awaited<ReturnType<typeof requestAuthUser>>;
  try {
    authUserResponse = await requestAuthUser(baseUrl, cookieHeader);
  } catch {
    return null;
  }

  if (!authUserResponse.ok || authUserResponse.data === undefined) {
    return null;
  }
  if (authUserResponse.data.user === undefined) {
    return null;
  }

  const u = authUserResponse.data.user;
  const hasEmail = u.email !== undefined && u.email !== null && u.email !== '';
  const hasUsername = u.username !== undefined && u.username !== null && u.username !== '';
  if (typeof u.id !== 'string' || (!hasEmail && !hasUsername)) {
    return null;
  }
  return {
    id: u.id,
    shortId: typeof u.shortId === 'string' ? u.shortId : u.id,
    email: hasEmail ? (u.email as string) : null,
    username: hasUsername ? (u.username as string) : null,
    displayName: u.displayName ?? null,
    preferredCurrency: u.preferredCurrency ?? null,
  };
}
