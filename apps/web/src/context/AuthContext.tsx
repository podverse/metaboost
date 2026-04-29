'use client';

import type { AuthTermsVersionPayload } from '../lib/auth-user';
import type { AuthUserPayload } from '../lib/auth-user';

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
import { parseAuthEnvelope } from '../lib/auth-user';
import { isPublicPath, ROUTES } from '../lib/routes';

function getRequiredSessionRefreshIntervalMs(): number {
  const raw = getSessionRefreshIntervalMs();
  if (raw === undefined || raw === '') {
    throw new Error(
      'NEXT_PUBLIC_SESSION_REFRESH_INTERVAL_MS is required. Set it to a positive number (ms) less than API_JWT_ACCESS_EXPIRATION * 1000 (e.g. 600000 for 10 minutes).'
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
  preferredCurrency: string | null;
  termsAcceptedAt: string | null;
  acceptedTermsEnforcementStartsAt: string | null;
  termsEnforcementStartsAt: string;
  hasAcceptedLatestTerms: boolean;
  currentTermsVersionKey: string;
  termsPolicyPhase: 'pre_announcement' | 'announcement' | 'enforced';
  acceptedCurrentTerms: boolean;
  acceptedUpcomingTerms: boolean;
  needsUpcomingTermsAcceptance: boolean;
  upcomingTermsAcceptanceBy: string | null;
  mustAcceptTermsNow: boolean;
  termsBlockerMessage: string | null;
  currentTerms: AuthTermsVersionPayload;
  upcomingTerms: AuthTermsVersionPayload | null;
  acceptedTerms: AuthTermsVersionPayload | null;
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
  logout: () => Promise<void>;
  setSession: (user: AuthUser) => void;
  hydrate: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function parseUserFromMe(data: unknown): AuthUser | null {
  const parsed = parseAuthEnvelope(data);
  if (parsed === null) {
    return null;
  }
  return mapAuthPayloadToUser(parsed);
}

function parseUserFromLoginOrRefresh(data: unknown): AuthUser | null {
  const parsed = parseAuthEnvelope(data);
  if (parsed === null) {
    return null;
  }
  return mapAuthPayloadToUser(parsed);
}

export function mapAuthPayloadToUser(payload: AuthUserPayload): AuthUser {
  return {
    id: payload.id,
    email: payload.email,
    username: payload.username,
    displayName: payload.displayName,
    preferredCurrency: payload.preferredCurrency,
    termsAcceptedAt: payload.termsAcceptedAt,
    acceptedTermsEnforcementStartsAt: payload.acceptedTermsEnforcementStartsAt,
    termsEnforcementStartsAt: payload.termsEnforcementStartsAt,
    hasAcceptedLatestTerms: payload.hasAcceptedLatestTerms,
    currentTermsVersionKey: payload.currentTermsVersionKey,
    termsPolicyPhase: payload.termsPolicyPhase,
    acceptedCurrentTerms: payload.acceptedCurrentTerms,
    acceptedUpcomingTerms: payload.acceptedUpcomingTerms,
    needsUpcomingTermsAcceptance: payload.needsUpcomingTermsAcceptance,
    upcomingTermsAcceptanceBy: payload.upcomingTermsAcceptanceBy,
    mustAcceptTermsNow: payload.mustAcceptTermsNow,
    termsBlockerMessage: payload.termsBlockerMessage,
    currentTerms: payload.currentTerms,
    upcomingTerms: payload.upcomingTerms,
    acceptedTerms: payload.acceptedTerms,
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
      const parsed = parseAuthEnvelope(res.data);
      if (parsed !== null) {
        setUser(mapAuthPayloadToUser(parsed));
      }
      return { ok: true };
    },
    []
  );

  const logout = useCallback(async () => {
    const baseUrl = getApiBaseUrl();
    try {
      await webAuth.logout(baseUrl);
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
