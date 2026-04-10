import type { ApiError } from './request.js';

/**
 * Response shape returned by auth endpoints (me, refresh, login, logout).
 * webAuth and managementWebAuth both satisfy this interface.
 */
export type SessionAuthResponse = {
  ok: boolean;
  status: number;
  data?: unknown;
  error?: ApiError;
};

/**
 * Auth API used for session hydration and proactive refresh.
 * Implemented by webAuth (main API) and managementWebAuth (management API);
 * each app uses its own client so cookies/tokens stay separate.
 */
export type SessionAuthApi = {
  me(baseUrl: string): Promise<SessionAuthResponse>;
  refresh(baseUrl: string): Promise<SessionAuthResponse>;
  logout(baseUrl: string): Promise<SessionAuthResponse>;
};

export type HydrateSessionOptions<T> = {
  authApi: SessionAuthApi;
  baseUrl: string;
  parseUserFromMe: (data: unknown) => T | null;
  parseUserFromLoginOrRefresh: (data: unknown) => T | null;
};

export type HydrateSessionResult<T> = {
  user: T | null;
  /** True when we got 401 and tried refresh; caller may redirect to login when user is null. */
  attemptedRefresh: boolean;
};

/**
 * Hydrate session: call /me, on 401 try /refresh, then parse user or clear.
 * Caller should set user from result.user; if result.user === null && result.attemptedRefresh,
 * call logout (if not already called) and redirect to login when not on a public path.
 */
export async function hydrateSession<T>(
  options: HydrateSessionOptions<T>
): Promise<HydrateSessionResult<T>> {
  const { authApi, baseUrl, parseUserFromMe, parseUserFromLoginOrRefresh } = options;
  try {
    const meRes = await authApi.me(baseUrl);
    if (meRes.ok && meRes.data !== undefined) {
      const u = parseUserFromMe(meRes.data);
      if (u !== null) {
        return { user: u, attemptedRefresh: false };
      }
    }
    const meWas401 = meRes.status === 401;
    if (meWas401) {
      const refreshRes = await authApi.refresh(baseUrl);
      if (refreshRes.ok && refreshRes.data !== undefined) {
        const u = parseUserFromLoginOrRefresh(refreshRes.data);
        if (u !== null) {
          return { user: u, attemptedRefresh: true };
        }
      }
      await authApi.logout(baseUrl);
      return { user: null, attemptedRefresh: true };
    }
    return { user: null, attemptedRefresh: false };
  } catch {
    return { user: null, attemptedRefresh: false };
  }
}

export type CreateSessionRefreshLoopOptions<T> = {
  getBaseUrl: () => string;
  authApi: { refresh(baseUrl: string): Promise<SessionAuthResponse> };
  parseUser: (data: unknown) => T | null;
  onSuccess: (user: T) => void;
  onFailure: () => void;
  /** Refresh interval (ms). Required; must be less than API access token expiry (API_JWT_ACCESS_EXPIRY_SECONDS * 1000). */
  refreshIntervalMs: number;
};

/**
 * Starts an interval that calls refresh every refreshIntervalMs.
 * On success and parsed user, calls onSuccess(user); otherwise calls onFailure()
 * (caller typically clears user, calls logout, redirects to login).
 * Returns a function that clears the interval (use as React useEffect cleanup).
 */
export function createSessionRefreshLoop<T>(
  options: CreateSessionRefreshLoopOptions<T>
): () => void {
  const { getBaseUrl, authApi, parseUser, onSuccess, onFailure, refreshIntervalMs } = options;
  if (refreshIntervalMs <= 0 || !Number.isFinite(refreshIntervalMs)) {
    throw new Error(
      'refreshIntervalMs is required and must be a positive number (ms), less than the API access token expiry in ms.'
    );
  }
  const interval = setInterval(async () => {
    const baseUrl = getBaseUrl();
    const refreshRes = await authApi.refresh(baseUrl);
    if (refreshRes.ok && refreshRes.data !== undefined) {
      const u = parseUser(refreshRes.data);
      if (u !== null) {
        onSuccess(u);
        return;
      }
    }
    onFailure();
  }, refreshIntervalMs);
  return () => clearInterval(interval);
}
