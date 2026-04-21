import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';

import { getServerManagementApiBaseUrl } from './config/env';
import {
  parseManagementMeEnvelope,
  type ManagementSessionUser,
} from './lib/management-me-envelope.js';
import { PUBLIC_PATHS, ROUTES } from './lib/routes';

const SESSION_COOKIE_NAME = 'management_api_session';
const REFRESH_COOKIE_NAME = 'management_api_refresh';
const AUTH_USER_HEADER = 'x-auth-user';

function requestHeadersWithoutInboundAuthUser(request: NextRequest): Headers {
  const h = new Headers(request.headers);
  h.delete(AUTH_USER_HEADER);
  return h;
}

function nextWithoutInboundAuthUser(request: NextRequest): NextResponse {
  return NextResponse.next({ request: { headers: requestHeadersWithoutInboundAuthUser(request) } });
}

function nextResponseWithAuthUser(request: NextRequest, user: ManagementSessionUser): NextResponse {
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
  authUser: ManagementSessionUser | null;
}> {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  const refreshCookie = request.cookies.get(REFRESH_COOKIE_NAME);
  if (sessionCookie === undefined && refreshCookie === undefined) {
    return {
      response: nextWithoutInboundAuthUser(request),
      hasRestoredSession: false,
      sessionInvalidated: false,
      authUser: null,
    };
  }

  const cookieHeader = request.headers.get('cookie') ?? '';
  const baseUrl = getServerManagementApiBaseUrl();
  if (baseUrl === '/v1' || baseUrl === '') {
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
      const authUser = parseManagementMeEnvelope(meBody);
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
  const authUser = parseManagementMeEnvelope(body);
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
  const { pathname } = request.nextUrl;

  // Skip proxy for static files, API routes, and _next internal routes
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
    return nextWithoutInboundAuthUser(request);
  }

  const { response, hasRestoredSession, sessionInvalidated } = await trySessionRestore(request);
  const hasSession =
    (request.cookies.has(SESSION_COOKIE_NAME) || hasRestoredSession) && !sessionInvalidated;
  const isPublic = PUBLIC_PATHS.includes(pathname);

  // Protected route without validated session -> redirect to login
  if (!isPublic && !hasSession) {
    const loginUrl = new URL(ROUTES.LOGIN, request.url);
    const redirectRes = NextResponse.redirect(loginUrl);
    if (sessionInvalidated) {
      appendClearSessionCookies(redirectRes);
    }
    return redirectRes;
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg).*)'],
};
