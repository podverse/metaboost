import type { Response } from 'express';

import { describe, expect, it, vi } from 'vitest';

import { clearSessionCookies, setSessionCookies } from './cookies.js';

describe('auth cookies Domain attribute', () => {
  it('omits Domain when cookieDomain is unset', () => {
    const setHeader = vi.fn();
    const res = { setHeader } as unknown as Response;
    setSessionCookies(res, 'access', 'refresh', {
      sessionCookieName: 'api_session',
      refreshCookieName: 'api_refresh',
      cookieSecure: false,
      cookieSameSite: 'lax',
      accessMaxAgeSeconds: 10,
      refreshMaxAgeSeconds: 20,
    });
    const [, cookies] = setHeader.mock.calls[0] as [string, string[]];
    expect(cookies.every((c) => !c.toLowerCase().includes('domain='))).toBe(true);
  });

  it('omits Domain when cookieDomain is localhost (host-only dev)', () => {
    const setHeader = vi.fn();
    const res = { setHeader } as unknown as Response;
    setSessionCookies(res, 'access', 'refresh', {
      sessionCookieName: 'api_session',
      refreshCookieName: 'api_refresh',
      cookieSecure: false,
      cookieSameSite: 'lax',
      cookieDomain: 'LOCALHOST',
      accessMaxAgeSeconds: 10,
      refreshMaxAgeSeconds: 20,
    });
    const [, cookies] = setHeader.mock.calls[0] as [string, string[]];
    expect(cookies.every((c) => !c.toLowerCase().includes('domain='))).toBe(true);
  });

  it('appends Domain when cookieDomain is set', () => {
    const setHeader = vi.fn();
    const res = { setHeader } as unknown as Response;
    setSessionCookies(res, 'access', 'refresh', {
      sessionCookieName: 'api_session',
      refreshCookieName: 'api_refresh',
      cookieSecure: false,
      cookieSameSite: 'lax',
      cookieDomain: '.example.com',
      accessMaxAgeSeconds: 10,
      refreshMaxAgeSeconds: 20,
    });
    const [name, cookies] = setHeader.mock.calls[0] as [string, string[]];
    expect(name).toBe('Set-Cookie');
    expect(cookies.every((c) => c.includes('Domain=.example.com'))).toBe(true);
  });

  it('clearSessionCookies includes Domain when cookieDomain is set', () => {
    const setHeader = vi.fn();
    const res = { setHeader } as unknown as Response;
    clearSessionCookies(res, {
      sessionCookieName: 'api_session',
      refreshCookieName: 'api_refresh',
      cookieSecure: false,
      cookieSameSite: 'lax',
      cookieDomain: '.example.com',
    });
    const [, cookies] = setHeader.mock.calls[0] as [string, string[]];
    expect(cookies.every((c) => c.includes('Domain=.example.com'))).toBe(true);
  });
});
