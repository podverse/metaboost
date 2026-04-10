import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';

import { getServerManagementApiBaseUrl } from './config/env';
import { PUBLIC_PATHS, ROUTES } from './lib/routes';

const SESSION_COOKIE_NAME = 'management_api_session';
const REFRESH_COOKIE_NAME = 'management_api_refresh';
const AUTH_USER_HEADER = 'x-auth-user';

async function trySessionRestore(
  request: NextRequest
): Promise<{ response: NextResponse; hasRestoredSession: boolean }> {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  const refreshCookie = request.cookies.get(REFRESH_COOKIE_NAME);
  if (sessionCookie === undefined && refreshCookie === undefined) {
    return { response: NextResponse.next(), hasRestoredSession: false };
  }

  const cookieHeader = request.headers.get('cookie') ?? '';
  const baseUrl = getServerManagementApiBaseUrl();
  if (baseUrl === '/v1' || baseUrl === '') {
    return { response: NextResponse.next(), hasRestoredSession: false };
  }

  const meRes = await fetch(`${baseUrl}/auth/me`, {
    headers: { Cookie: cookieHeader },
    cache: 'no-store',
  });
  if (meRes.status === 200) {
    return { response: NextResponse.next(), hasRestoredSession: false };
  }
  if (meRes.status !== 401) {
    return { response: NextResponse.next(), hasRestoredSession: false };
  }

  const refreshRes = await fetch(`${baseUrl}/auth/refresh`, {
    method: 'POST',
    headers: { Cookie: cookieHeader },
    cache: 'no-store',
  });
  if (refreshRes.status !== 200) {
    return { response: NextResponse.next(), hasRestoredSession: false };
  }

  let body: {
    user?: {
      id?: string;
      username?: string;
      displayName?: string | null;
      isSuperAdmin?: boolean;
      permissions?: unknown;
    };
  };
  try {
    body = (await refreshRes.json()) as typeof body;
  } catch {
    return { response: NextResponse.next(), hasRestoredSession: false };
  }
  const user = body?.user;
  if (user === undefined || typeof user.id !== 'string' || typeof user.username !== 'string') {
    return { response: NextResponse.next(), hasRestoredSession: false };
  }

  const authUser = JSON.stringify({
    id: user.id,
    username: user.username,
    displayName: user.displayName ?? null,
    isSuperAdmin: user.isSuperAdmin === true,
    permissions: user.permissions ?? null,
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
  return { response: nextRes, hasRestoredSession: true };
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip proxy for static files, API routes, and _next internal routes
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
    return NextResponse.next();
  }

  const { response, hasRestoredSession } = await trySessionRestore(request);
  const hasSession = request.cookies.has(SESSION_COOKIE_NAME) || hasRestoredSession;
  const isPublic = PUBLIC_PATHS.includes(pathname);

  // Protected route without session -> redirect to login
  if (!isPublic && !hasSession) {
    const loginUrl = new URL(ROUTES.LOGIN, request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Do not redirect away from login/signup here. A stale or invalid session cookie
  // would cause a loop: proxy sends /login -> dashboard, then getServerUser() fails
  // and dashboard redirects to /login. Let the login/signup pages and API handle
  // validity; they redirect to dashboard only when the session is actually valid.

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg).*)'],
};
