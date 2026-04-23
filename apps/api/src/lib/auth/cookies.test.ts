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

  it('includes Secure when cookieSecure is true and encodes token values', () => {
    const setHeader = vi.fn();
    const res = { setHeader } as unknown as Response;
    setSessionCookies(res, 'access token', 'refresh/token', {
      sessionCookieName: 'api_session',
      refreshCookieName: 'api_refresh',
      cookieSecure: true,
      cookieSameSite: 'none',
      cookieDomain: '.example.com',
      accessMaxAgeSeconds: 30,
      refreshMaxAgeSeconds: 60,
    });

    const [, cookies] = setHeader.mock.calls[0] as [string, string[]];
    expect(cookies.every((c) => c.includes('Secure'))).toBe(true);
    expect(cookies[0]).toContain('api_session=access%20token');
    expect(cookies[1]).toContain('api_refresh=refresh%2Ftoken');
    expect(cookies[0]).toContain('SameSite=none');
  });
});
