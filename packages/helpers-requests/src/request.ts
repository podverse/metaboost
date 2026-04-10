import type { BearerToken } from './types/request-types.js';

/**
 * Shared request helper. All API request modules use this for consistent
 * behavior (base URL, auth header, JSON, error shape).
 */
export type ApiError = {
  status: number;
  message: string;
  /** Present when status is 429; seconds until the client can retry. */
  retryAfterSeconds?: number;
};

export type ApiResponse<T = unknown> =
  | { ok: true; status: number; data?: T }
  | { ok: false; status: number; error: ApiError };

export type RequestOptions = RequestInit & {
  token?: BearerToken;
  /** When set, sent as Accept-Language so the API can localize responses (e.g. emails, password validation). */
  locale?: string;
};

export async function request<T = unknown>(
  baseUrl: string,
  path: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { token, locale, ...init } = options;
  const trimmedBase = baseUrl.replace(/\/$/, '');
  const pathPart = path.startsWith('/') ? path : `/${path}`;
  const url = path.startsWith('http') ? path : `${trimmedBase}${pathPart}`;
  const headers = new Headers(init.headers);
  if (token !== undefined && token !== null && token !== '') {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (locale !== undefined && locale !== null && locale !== '') {
    headers.set('Accept-Language', locale);
  }
  if (init.body !== undefined && typeof init.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, {
    ...init,
    headers,
    credentials: init.credentials ?? 'include',
  });
  let data: unknown;
  const contentType = res.headers.get('Content-Type');
  if (contentType?.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = undefined;
    }
  } else {
    data = undefined;
  }

  if (!res.ok) {
    const message =
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof (data as { message: unknown }).message === 'string'
        ? (data as { message: string }).message
        : res.statusText || 'Request failed';
    const error: ApiError = { status: res.status, message };
    if (res.status === 429) {
      // retryAfterSeconds is in the JSON body — the single source of truth for how long
      // until the client can retry. Browser fetch can always read the body regardless of
      // CORS header-exposure rules (unlike the Retry-After header).
      if (
        typeof data === 'object' &&
        data !== null &&
        'retryAfterSeconds' in data &&
        typeof (data as { retryAfterSeconds: unknown }).retryAfterSeconds === 'number' &&
        (data as { retryAfterSeconds: number }).retryAfterSeconds > 0
      ) {
        error.retryAfterSeconds = (data as { retryAfterSeconds: number }).retryAfterSeconds;
      }
    }
    return { ok: false, status: res.status, error };
  }

  // JSON parse returns unknown; caller supplies type via request<T>() for typed data
  return { ok: true, status: res.status, data: data as T };
}
