import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';

import { isSafeRelativeAppPath } from '@metaboost/helpers';

import { getApiVersionPath, getAccountSignupMode, getServerApiBaseUrl } from './config/env';
import { parseAuthEnvelope, type AuthUserPayload } from './lib/auth-user';
import { getWebAccountSignupModeCapabilities } from './lib/authMode';
import { isPublicPath, loginRoute, ROUTES } from './lib/routes';

const SESSION_COOKIE_NAME = 'api_session';
const REFRESH_COOKIE_NAME = 'api_refresh';
const AUTH_USER_HEADER = 'x-auth-user';

function requestHeadersWithoutInboundAuthUser(request: NextRequest): Headers {
  const h = new Headers(request.headers);
  h.delete(AUTH_USER_HEADER);
  return h;
}

function nextWithoutInboundAuthUser(request: NextRequest): NextResponse {
  return NextResponse.next({ request: { headers: requestHeadersWithoutInboundAuthUser(request) } });
}

function nextResponseWithAuthUser(request: NextRequest, user: AuthUserPayload): NextResponse {
  const newHeaders = requestHeadersWithoutInboundAuthUser(request);
  newHeaders.set(AUTH_USER_HEADER, JSON.stringify(user));
  return NextResponse.next({ request: { headers: newHeaders } });
}

/** Clear session/refresh cookies (Path=/; Max-Age=0) so the client drops them. */
function appendClearSessionCookies(res: NextResponse): void {
  const opts = 'Path=/; Max-Age=0; HttpOnly; SameSite=lax';
  res.headers.append('Set-Cookie', `${SESSION_COOKIE_NAME}=; ${opts}`);
  res.headers.append('Set-Cookie', `${REFRESH_COOKIE_NAME}=; ${opts}`);
}

async function trySessionRestore(request: NextRequest): Promise<{
  response: NextResponse;
  hasRestoredSession: boolean;
  sessionInvalidated: boolean;
  authUser: AuthUserPayload | null;
}> {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  const refreshCookie = request.cookies.get(REFRESH_COOKIE_NAME);
  if (sessionCookie === undefined && refreshCookie === undefined) {
    return {
      response: NextResponse.next(),
      hasRestoredSession: false,
      sessionInvalidated: false,
      authUser: null,
    };
  }

  const cookieHeader = request.headers.get('cookie') ?? '';
  const baseUrl = getServerApiBaseUrl();
  const versionPath = getApiVersionPath();
  if (baseUrl === versionPath || baseUrl === '') {
    return {
      response: NextResponse.next(),
      hasRestoredSession: false,
      sessionInvalidated: false,
      authUser: null,
    };
  }

  const meRes = await fetch(`${baseUrl}/auth/me`, {
    headers: { Cookie: cookieHeader },
    cache: 'no-store',
  });
  if (meRes.status === 200) {
    try {
      const meBody = await meRes.json();
      const authUser = parseAuthEnvelope(meBody);
      if (authUser !== null) {
        return {
          response: nextResponseWithAuthUser(request, authUser),
          hasRestoredSession: false,
          sessionInvalidated: false,
          authUser,
        };
      }
    } catch {
      // If me JSON cannot be parsed, continue with normal session handling.
    }
    return {
      response: nextWithoutInboundAuthUser(request),
      hasRestoredSession: false,
      sessionInvalidated: false,
      authUser: null,
    };
  }
  if (meRes.status !== 401) {
    return {
      response: nextWithoutInboundAuthUser(request),
      hasRestoredSession: false,
      sessionInvalidated: false,
      authUser: null,
    };
  }

  const refreshRes = await fetch(`${baseUrl}/auth/refresh`, {
    method: 'POST',
    headers: { Cookie: cookieHeader },
    cache: 'no-store',
  });
  if (refreshRes.status !== 200) {
    const res = nextWithoutInboundAuthUser(request);
    appendClearSessionCookies(res);
    return { response: res, hasRestoredSession: false, sessionInvalidated: true, authUser: null };
  }

  let body: unknown;
  try {
    body = await refreshRes.json();
  } catch {
    const res = nextWithoutInboundAuthUser(request);
    appendClearSessionCookies(res);
    return { response: res, hasRestoredSession: false, sessionInvalidated: true, authUser: null };
  }
  const authUser = parseAuthEnvelope(body);
  if (authUser === null) {
    const res = nextWithoutInboundAuthUser(request);
    appendClearSessionCookies(res);
    return { response: res, hasRestoredSession: false, sessionInvalidated: true, authUser: null };
  }

  const nextRes = nextResponseWithAuthUser(request, authUser);
  const setCookies = refreshRes.headers.getSetCookie?.();
  if (Array.isArray(setCookies)) {
    for (const value of setCookies) {
      nextRes.headers.append('Set-Cookie', value);
    }
  }
  return { response: nextRes, hasRestoredSession: true, sessionInvalidated: false, authUser };
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Skip proxy for static files, API routes, and _next internal routes
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
    return nextWithoutInboundAuthUser(request);
  }

  const { response, hasRestoredSession, sessionInvalidated, authUser } =
    await trySessionRestore(request);
  const hasSession =
    (request.cookies.has(SESSION_COOKIE_NAME) || hasRestoredSession) && !sessionInvalidated;
  const isPublic = isPublicPath(pathname);
  const needsLatestTermsAcceptance =
    hasSession && authUser !== null && authUser.mustAcceptTermsNow === true;
  const hasLatestTermsAcceptance =
    hasSession && authUser !== null && authUser.mustAcceptTermsNow === false;
  const accountSignupModeCapabilities = getWebAccountSignupModeCapabilities(getAccountSignupMode());

  // Mode-disabled auth routes should not be accessible.
  if (pathname === ROUTES.SIGNUP && !accountSignupModeCapabilities.canPublicSignup) {
    const redirectRes = NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
    if (sessionInvalidated) {
      appendClearSessionCookies(redirectRes);
    }
    return redirectRes;
  }
  if (
    (pathname === ROUTES.FORGOT_PASSWORD ||
      pathname === ROUTES.RESET_PASSWORD ||
      pathname === ROUTES.VERIFY_EMAIL ||
      pathname === ROUTES.CONFIRM_EMAIL_CHANGE) &&
    !accountSignupModeCapabilities.canUseEmailVerificationFlows
  ) {
    const redirectRes = NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
    if (sessionInvalidated) {
      appendClearSessionCookies(redirectRes);
    }
    return redirectRes;
  }
  if (pathname === ROUTES.SET_PASSWORD && !accountSignupModeCapabilities.canIssueAdminInviteLink) {
    const redirectRes = NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
    if (sessionInvalidated) {
      appendClearSessionCookies(redirectRes);
    }
    return redirectRes;
  }

  // Protected route without session -> redirect to login
  if (!isPublic && !hasSession) {
    const currentPathWithQuery = `${pathname}${search}`;
    const loginUrl = new URL(loginRoute(currentPathWithQuery), request.url);
    const redirectRes = NextResponse.redirect(loginUrl);
    if (sessionInvalidated) {
      appendClearSessionCookies(redirectRes);
    }
    return redirectRes;
  }

  if (
    needsLatestTermsAcceptance &&
    pathname !== ROUTES.TERMS_REQUIRED &&
    pathname !== ROUTES.TERMS
  ) {
    const redirectRes = NextResponse.redirect(new URL(ROUTES.TERMS_REQUIRED, request.url));
    if (sessionInvalidated) {
      appendClearSessionCookies(redirectRes);
    }
    return redirectRes;
  }
  if (hasLatestTermsAcceptance && pathname === ROUTES.TERMS_REQUIRED) {
    const redirectRes = NextResponse.redirect(new URL(ROUTES.DASHBOARD, request.url));
    if (sessionInvalidated) {
      appendClearSessionCookies(redirectRes);
    }
    return redirectRes;
  }

  // Already logged in visiting login/signup -> redirect to dashboard or returnUrl
  if (hasSession && (pathname === ROUTES.LOGIN || pathname === ROUTES.SIGNUP)) {
    const returnUrl = new URL(request.url).searchParams.get('returnUrl');
    const safeReturn = returnUrl !== null && isSafeRelativeAppPath(returnUrl);
    let target = safeReturn ? returnUrl.trim() : ROUTES.DASHBOARD;
    if (needsLatestTermsAcceptance) {
      target = ROUTES.TERMS_REQUIRED;
    }
    const normalizedPath = target.replace(/\/$/, '').split('?')[0] || '/';
    if (normalizedPath === ROUTES.LOGIN || normalizedPath === ROUTES.SIGNUP) {
      target = ROUTES.DASHBOARD;
    }
    const redirectUrl = new URL(target, request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg).*)'],
};
