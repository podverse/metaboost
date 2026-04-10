import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';

import { getApiVersionPath, getAuthMode, getServerApiBaseUrl } from './config/env';
import { getWebAuthModeCapabilities } from './lib/authMode';
import { isPublicPath, ROUTES } from './lib/routes';

const SESSION_COOKIE_NAME = 'api_session';
const REFRESH_COOKIE_NAME = 'api_refresh';
const AUTH_USER_HEADER = 'x-auth-user';

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
}> {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  const refreshCookie = request.cookies.get(REFRESH_COOKIE_NAME);
  if (sessionCookie === undefined && refreshCookie === undefined) {
    return { response: NextResponse.next(), hasRestoredSession: false, sessionInvalidated: false };
  }

  const cookieHeader = request.headers.get('cookie') ?? '';
  const baseUrl = getServerApiBaseUrl();
  const versionPath = getApiVersionPath();
  if (baseUrl === versionPath || baseUrl === '') {
    return { response: NextResponse.next(), hasRestoredSession: false, sessionInvalidated: false };
  }

  const meRes = await fetch(`${baseUrl}/auth/me`, {
    headers: { Cookie: cookieHeader },
    cache: 'no-store',
  });
  if (meRes.status === 200) {
    return { response: NextResponse.next(), hasRestoredSession: false, sessionInvalidated: false };
  }
  if (meRes.status !== 401) {
    return { response: NextResponse.next(), hasRestoredSession: false, sessionInvalidated: false };
  }

  const refreshRes = await fetch(`${baseUrl}/auth/refresh`, {
    method: 'POST',
    headers: { Cookie: cookieHeader },
    cache: 'no-store',
  });
  if (refreshRes.status !== 200) {
    const res = NextResponse.next();
    appendClearSessionCookies(res);
    return { response: res, hasRestoredSession: false, sessionInvalidated: true };
  }

  let body: {
    user?: {
      id?: string;
      shortId?: string;
      email?: string | null;
      username?: string | null;
      displayName?: string | null;
    };
  };
  try {
    body = (await refreshRes.json()) as typeof body;
  } catch {
    const res = NextResponse.next();
    appendClearSessionCookies(res);
    return { response: res, hasRestoredSession: false, sessionInvalidated: true };
  }
  const user = body?.user;
  if (user === undefined || typeof user.id !== 'string') {
    const res = NextResponse.next();
    appendClearSessionCookies(res);
    return { response: res, hasRestoredSession: false, sessionInvalidated: true };
  }
  const hasEmail = user.email !== undefined && user.email !== null && user.email !== '';
  const hasUsername = user.username !== undefined && user.username !== null && user.username !== '';
  if (!hasEmail && !hasUsername) {
    const res = NextResponse.next();
    appendClearSessionCookies(res);
    return { response: res, hasRestoredSession: false, sessionInvalidated: true };
  }

  const authUser = JSON.stringify({
    id: user.id,
    shortId: typeof user.shortId === 'string' ? user.shortId : user.id,
    email: hasEmail ? user.email : null,
    username: hasUsername ? user.username : null,
    displayName: user.displayName ?? null,
  });
  const newHeaders = new Headers(request.headers);
  newHeaders.set(AUTH_USER_HEADER, authUser);
  const nextRes = NextResponse.next({ request: { headers: newHeaders } });
  const setCookies = refreshRes.headers.getSetCookie?.();
  if (Array.isArray(setCookies)) {
    for (const value of setCookies) {
      nextRes.headers.append('Set-Cookie', value);
    }
  }
  return { response: nextRes, hasRestoredSession: true, sessionInvalidated: false };
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip proxy for static files, API routes, and _next internal routes
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
    return NextResponse.next();
  }

  const { response, hasRestoredSession, sessionInvalidated } = await trySessionRestore(request);
  const hasSession =
    (request.cookies.has(SESSION_COOKIE_NAME) || hasRestoredSession) && !sessionInvalidated;
  const isPublic = isPublicPath(pathname);
  const authModeCapabilities = getWebAuthModeCapabilities(getAuthMode());

  // Mode-disabled auth routes should not be accessible.
  if (pathname === ROUTES.SIGNUP && !authModeCapabilities.canPublicSignup) {
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
    !authModeCapabilities.canUseEmailVerificationFlows
  ) {
    const redirectRes = NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
    if (sessionInvalidated) {
      appendClearSessionCookies(redirectRes);
    }
    return redirectRes;
  }
  if (pathname === ROUTES.SET_PASSWORD && !authModeCapabilities.canIssueAdminInviteLink) {
    const redirectRes = NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
    if (sessionInvalidated) {
      appendClearSessionCookies(redirectRes);
    }
    return redirectRes;
  }

  // Protected route without session -> redirect to login
  if (!isPublic && !hasSession) {
    const loginUrl = new URL(ROUTES.LOGIN, request.url);
    const redirectRes = NextResponse.redirect(loginUrl);
    if (sessionInvalidated) {
      appendClearSessionCookies(redirectRes);
    }
    return redirectRes;
  }

  // Already logged in visiting login/signup -> redirect to dashboard or returnUrl
  if (hasSession && (pathname === ROUTES.LOGIN || pathname === ROUTES.SIGNUP)) {
    const returnUrl = new URL(request.url).searchParams.get('returnUrl');
    const safeReturn =
      returnUrl !== null && returnUrl.trim().startsWith('/') && !returnUrl.trim().startsWith('//');
    let target = safeReturn ? returnUrl.trim() : ROUTES.DASHBOARD;
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
