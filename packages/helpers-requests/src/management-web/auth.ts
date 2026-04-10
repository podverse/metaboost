import type { ApiError } from '../request.js';

import { request } from '../request.js';

export type AuthResponse = Promise<{
  ok: boolean;
  status: number;
  data?: unknown;
  error?: ApiError;
}>;

/** Call /auth/me. Use token for Bearer (e.g. non-browser); omit for cookie auth. */
export async function me(baseUrl: string, token?: string | null): AuthResponse {
  return request(baseUrl, '/auth/me', { token: token ?? undefined });
}

export async function refresh(baseUrl: string): AuthResponse {
  return request(baseUrl, '/auth/refresh', { method: 'POST' });
}

export async function logout(baseUrl: string): AuthResponse {
  return request(baseUrl, '/auth/logout', { method: 'POST' });
}

export async function login(baseUrl: string, username: string, password: string): AuthResponse {
  return request(baseUrl, '/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

/** Call POST /auth/change-password (authenticated). Uses cookies by default. */
export async function changePassword(
  baseUrl: string,
  body: { currentPassword: string; newPassword: string },
  options?: { locale?: string; token?: string | null }
): AuthResponse {
  return request(baseUrl, '/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(body),
    locale: options?.locale,
    token: options?.token ?? undefined,
  });
}

/** Call PATCH /auth/me to update profile (display name only). Uses cookies by default. */
export async function updateProfile(
  baseUrl: string,
  body: { displayName: string },
  options?: { token?: string | null }
): AuthResponse {
  return request(baseUrl, '/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(body),
    token: options?.token ?? undefined,
  });
}
