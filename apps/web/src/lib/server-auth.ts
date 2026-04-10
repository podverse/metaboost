import 'server-only';
import { cookies, headers } from 'next/headers';

import { request } from '@boilerplate/helpers-requests';

import { getServerApiBaseUrl } from '../config/env';

export type ServerUser = {
  id: string;
  shortId: string;
  email: string | null;
  username: string | null;
  displayName: string | null;
};

const AUTH_USER_HEADER = 'x-auth-user';

function parseAuthUserHeader(value: string | null): ServerUser | null {
  if (value === null || value === '') return null;
  try {
    const parsed = JSON.parse(value) as {
      id?: string;
      shortId?: string;
      email?: string | null;
      username?: string | null;
      displayName?: string | null;
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
    };
  } catch {
    return null;
  }
}

/**
 * Get the current user from the API server-side.
 * Prefers x-auth-user header when set by middleware (after SSR session restore).
 * Otherwise forwards cookies from the incoming request to the API.
 * Returns null if not authenticated.
 */
export async function getServerUser(): Promise<ServerUser | null> {
  const headerStore = await headers();
  const authUserHeader = headerStore.get(AUTH_USER_HEADER);
  const fromHeader = parseAuthUserHeader(authUserHeader);
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

  try {
    const res = await request(baseUrl, '/auth/me', {
      headers: { Cookie: cookieHeader },
      cache: 'no-store',
    });

    if (!res.ok || res.data === undefined) {
      return null;
    }

    const data = res.data as { user?: ServerUser };
    if (data.user === undefined) {
      return null;
    }

    const u = data.user;
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
    };
  } catch {
    return null;
  }
}
