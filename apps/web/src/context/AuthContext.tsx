'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { AUTH_MESSAGE_LOGIN_FAILED, LOGOUT_REDIRECT_TIMEOUT_MS } from '@metaboost/helpers';
import {
  createSessionRefreshLoop,
  getRateLimitRetrySeconds,
  hydrateSession,
  webAuth,
} from '@metaboost/helpers-requests';

import { getSessionRefreshIntervalMs } from '../config/env';
import { getApiBaseUrl } from '../lib/api-client';
import { isPublicPath, ROUTES } from '../lib/routes';

function getRequiredSessionRefreshIntervalMs(): number {
  const raw = getSessionRefreshIntervalMs();
  if (raw === undefined || raw === '') {
    throw new Error(
      'NEXT_PUBLIC_SESSION_REFRESH_INTERVAL_MS is required. Set it to a positive number (ms) less than API_JWT_ACCESS_EXPIRY_SECONDS * 1000 (e.g. 600000 for 10 minutes).'
    );
  }
  const ms = Number.parseInt(raw, 10);
  if (!Number.isFinite(ms) || ms <= 0) {
    throw new Error('NEXT_PUBLIC_SESSION_REFRESH_INTERVAL_MS must be a positive number (ms).');
  }
  return ms;
}

export type AuthUser = {
  id: string;
  email: string | null;
  username: string | null;
  displayName: string | null;
};

export type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<
    { ok: true } | { ok: false; message: string; rateLimit?: { retryAfterSeconds: number } }
  >;
  logout: () => void;
  setSession: (user: AuthUser) => void;
  hydrate: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function parseUserFromMe(data: unknown): AuthUser | null {
  if (data === undefined || typeof data !== 'object' || data === null) return null;
  if (!('user' in data) || typeof (data as { user: unknown }).user !== 'object') return null;
  const u = (
    data as {
      user: {
        id?: string;
        email?: string | null;
        username?: string | null;
        displayName?: string | null;
      };
    }
  ).user;
  if (typeof u.id !== 'string') return null;
  const hasEmail = u.email !== undefined && u.email !== null && u.email !== '';
  const hasUsername = u.username !== undefined && u.username !== null && u.username !== '';
  if (!hasEmail && !hasUsername) return null;
  return {
    id: u.id,
    email: hasEmail ? (u.email as string) : null,
    username: hasUsername ? (u.username as string) : null,
    displayName: u.displayName ?? null,
  };
}

function parseUserFromLoginOrRefresh(data: unknown): AuthUser | null {
  if (data === undefined || typeof data !== 'object' || data === null) return null;
  if (!('user' in data) || typeof (data as { user: unknown }).user !== 'object') return null;
  const u = (
    data as {
      user: {
        id?: string;
        email?: string | null;
        username?: string | null;
        displayName?: string | null;
      };
    }
  ).user;
  if (typeof u.id !== 'string') return null;
  const hasEmail = u.email !== undefined && u.email !== null && u.email !== '';
  const hasUsername = u.username !== undefined && u.username !== null && u.username !== '';
  if (!hasEmail && !hasUsername) return null;
  return {
    id: u.id,
    email: hasEmail ? (u.email as string) : null,
    username: hasUsername ? (u.username as string) : null,
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
        authApi: webAuth,
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
  // (initialUser === null means session was expired/missing at SSR — client should try refresh).
  useEffect(() => {
    if (initialUser === undefined || initialUser === null) {
      void hydrate();
    }
  }, [hydrate, initialUser]);

  // Proactively refresh the session before the access token expires (shared helper).
  // On failure, await logout (with timeout) before redirect so cookies are cleared.
  const refreshIntervalMs = getRequiredSessionRefreshIntervalMs();
  useEffect(() => {
    if (user === null) return;
    const stop = createSessionRefreshLoop({
      getBaseUrl: getApiBaseUrl,
      authApi: webAuth,
      parseUser: parseUserFromLoginOrRefresh,
      onSuccess: setUser,
      refreshIntervalMs,
      onFailure: () => {
        setUser(null);
        void (async () => {
          const timeout = new Promise<void>((resolve) =>
            setTimeout(resolve, LOGOUT_REDIRECT_TIMEOUT_MS)
          );
          await Promise.race([webAuth.logout(getApiBaseUrl()).catch(() => {}), timeout]);
          window.location.href = ROUTES.LOGIN;
        })();
      },
    });
    return stop;
  }, [user]);

  const login = useCallback(
    async (
      email: string,
      password: string
    ): Promise<
      { ok: true } | { ok: false; message: string; rateLimit?: { retryAfterSeconds: number } }
    > => {
      const baseUrl = getApiBaseUrl();
      const res = await webAuth.login(baseUrl, email, password);
      if (!res.ok) {
        const message = res.error?.message ?? AUTH_MESSAGE_LOGIN_FAILED;
        const rateLimit =
          res.status === 429
            ? {
                retryAfterSeconds: getRateLimitRetrySeconds(
                  'auth:login',
                  res.error?.retryAfterSeconds
                ),
              }
            : undefined;
        return { ok: false, message, rateLimit };
      }
      const data = res.data as {
        user?: {
          id: string;
          email: string;
          displayName: string | null;
        };
      };
      const u = data?.user
        ? (() => {
            const us = data.user as {
              id?: string;
              email?: string | null;
              username?: string | null;
              displayName?: string | null;
            };
            if (typeof us.id !== 'string') return null;
            const hasEmail = us.email !== undefined && us.email !== null && us.email !== '';
            const hasUsername =
              us.username !== undefined && us.username !== null && us.username !== '';
            if (!hasEmail && !hasUsername) return null;
            return {
              id: us.id,
              email: hasEmail ? (us.email as string) : null,
              username: hasUsername ? (us.username as string) : null,
              displayName: us.displayName ?? null,
            };
          })()
        : null;
      if (u !== null) setUser(u);
      return { ok: true };
    },
    []
  );

  const logout = useCallback(async () => {
    const baseUrl = getApiBaseUrl();
    await webAuth.logout(baseUrl);
    setUser(null);
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
