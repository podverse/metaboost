'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { AUTH_MESSAGE_LOGIN_FAILED, LOGOUT_REDIRECT_TIMEOUT_MS } from '@metaboost/helpers';
import {
  createSessionRefreshLoop,
  getRateLimitRetrySeconds,
  hydrateSession,
  managementWebAuth,
} from '@metaboost/helpers-requests';

import { getSessionRefreshIntervalMs } from '../config/env';
import { getApiBaseUrl } from '../lib/api-client';
import { isPublicPath, ROUTES } from '../lib/routes';

function getRequiredSessionRefreshIntervalMs(): number {
  const raw = getSessionRefreshIntervalMs();
  if (raw === undefined || raw === '') {
    throw new Error(
      'NEXT_PUBLIC_MANAGEMENT_SESSION_REFRESH_INTERVAL_MS is required. Set it to a positive number (ms) less than MANAGEMENT_API_JWT_ACCESS_EXPIRATION * 1000 (e.g. 1800000 for 30 minutes).'
    );
  }
  const ms = Number.parseInt(raw, 10);
  if (!Number.isFinite(ms) || ms <= 0) {
    throw new Error(
      'NEXT_PUBLIC_MANAGEMENT_SESSION_REFRESH_INTERVAL_MS must be a positive number (ms).'
    );
  }
  return ms;
}

export type AuthUser = {
  id: string;
  username: string;
  displayName: string | null;
};

export type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (
    username: string,
    password: string
  ) => Promise<
    { ok: true } | { ok: false; message: string; rateLimit?: { retryAfterSeconds: number } }
  >;
  logout: () => Promise<void>;
  setSession: (user: AuthUser) => void;
  hydrate: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function parseUserFromMe(data: unknown): AuthUser | null {
  if (data === undefined || typeof data !== 'object' || data === null) return null;
  if (!('user' in data) || typeof (data as { user: unknown }).user !== 'object') return null;
  const u = (data as { user: { id?: string; username?: string; displayName?: string | null } })
    .user;
  if (typeof u.id !== 'string' || typeof u.username !== 'string') return null;
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName ?? null,
  };
}

function parseUserFromLoginOrRefresh(data: unknown): AuthUser | null {
  if (data === undefined || typeof data !== 'object' || data === null) return null;
  if (!('user' in data) || typeof (data as { user: unknown }).user !== 'object') return null;
  const u = (data as { user: { id?: string; username?: string; displayName?: string | null } })
    .user;
  if (typeof u.id !== 'string' || typeof u.username !== 'string') return null;
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName ?? null,
  };
}

type AuthProviderProps = {
  children: React.ReactNode;
  initialUser?: AuthUser | null;
};

export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(initialUser ?? null);
  const [loading, setLoading] = useState(false);

  const hydrate = useCallback(async () => {
    try {
      const baseUrl = getApiBaseUrl();
      const result = await hydrateSession({
        authApi: managementWebAuth,
        baseUrl,
        parseUserFromMe,
        parseUserFromLoginOrRefresh,
      });
      setUser(result.user);
      if (result.user === null && result.attemptedRefresh) {
        const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
        if (!isPublicPath(pathname)) {
          window.location.href = ROUTES.LOGIN;
        }
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Hydrate if no initial user was provided, or if SSR could not authenticate
  // (initialUser === null means the JWT was expired/missing at SSR time — client
  // should attempt refresh before giving up).
  useEffect(() => {
    if (initialUser === undefined || initialUser === null) {
      void hydrate();
    }
  }, [hydrate, initialUser]);

  // Proactively refresh the access token before it expires (shared helper).
  const refreshIntervalMs = getRequiredSessionRefreshIntervalMs();
  useEffect(() => {
    if (user === null) return;
    const stop = createSessionRefreshLoop({
      getBaseUrl: getApiBaseUrl,
      authApi: managementWebAuth,
      parseUser: parseUserFromLoginOrRefresh,
      onSuccess: setUser,
      refreshIntervalMs,
      onFailure: () => {
        setUser(null);
        void (async () => {
          const timeout = new Promise<void>((resolve) =>
            setTimeout(resolve, LOGOUT_REDIRECT_TIMEOUT_MS)
          );
          await Promise.race([managementWebAuth.logout(getApiBaseUrl()).catch(() => {}), timeout]);
          window.location.href = ROUTES.LOGIN;
        })();
      },
    });
    return stop;
  }, [user]);

  const login = useCallback(
    async (
      username: string,
      password: string
    ): Promise<
      { ok: true } | { ok: false; message: string; rateLimit?: { retryAfterSeconds: number } }
    > => {
      const baseUrl = getApiBaseUrl();
      const res = await managementWebAuth.login(baseUrl, username, password);
      if (!res.ok) {
        const message = res.error?.message ?? AUTH_MESSAGE_LOGIN_FAILED;
        const rateLimit =
          res.status === 429
            ? {
                retryAfterSeconds: getRateLimitRetrySeconds(
                  'management:login',
                  res.error?.retryAfterSeconds
                ),
              }
            : undefined;
        return { ok: false, message, rateLimit };
      }
      const data = res.data as {
        user?: { id: string; username: string; displayName: string | null };
      };
      const u = data?.user
        ? {
            id: data.user.id,
            username: data.user.username,
            displayName: data.user.displayName ?? null,
          }
        : null;
      if (u !== null) setUser(u);
      return { ok: true };
    },
    []
  );

  const logout = useCallback(async () => {
    const baseUrl = getApiBaseUrl();
    try {
      await managementWebAuth.logout(baseUrl);
    } catch {
      // Best-effort API logout; client session cleared in finally.
    } finally {
      setUser(null);
    }
  }, []);

  const setSession = useCallback((u: AuthUser) => {
    setUser(u);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout, setSession, hydrate }),
    [user, loading, login, logout, setSession, hydrate]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === null) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
