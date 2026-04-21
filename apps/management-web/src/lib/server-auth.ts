import 'server-only';

import type { ManagementUserPermissions } from '../types/management-api';

import { headers } from 'next/headers';

import { request } from '@metaboost/helpers-requests';

import { getServerManagementApiBaseUrl } from '../config/env';
import { parseManagementMeEnvelope, type ManagementSessionUser } from './management-me-envelope';
import { getCookieHeader } from './server-request';

export type ServerUser = ManagementSessionUser;

const AUTH_USER_HEADER = 'x-auth-user';

function getServerApiBaseUrl(): string {
  return getServerManagementApiBaseUrl();
}

function parseAuthUserHeader(value: string | null): ServerUser | null {
  if (value === null || value === '') return null;
  try {
    const parsed = JSON.parse(value) as {
      id?: string;
      username?: string;
      displayName?: string | null;
      isSuperAdmin?: boolean;
      permissions?: ManagementUserPermissions | null;
    };
    if (typeof parsed.id !== 'string' || typeof parsed.username !== 'string') {
      return null;
    }
    return {
      id: parsed.id,
      username: parsed.username,
      displayName: parsed.displayName ?? null,
      isSuperAdmin: parsed.isSuperAdmin === true,
      permissions: parsed.permissions ?? null,
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

  const cookieHeader = await getCookieHeader();

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

    return parseManagementMeEnvelope(res.data);
  } catch {
    return null;
  }
}
