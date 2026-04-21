import { describe, expect, it } from 'vitest';

import {
  isSafeLoginReturnUrl,
  isSafeRelativeAppPath,
  resolveReturnUrlFromQuery,
  safeReturnPathOrFallback,
} from './safeReturnUrl.js';

describe('safeReturnUrl', () => {
  it('isSafeRelativeAppPath rejects protocol-relative and external schemes', () => {
    expect(isSafeRelativeAppPath('/dashboard')).toBe(true);
    expect(isSafeRelativeAppPath('/bucket/x/settings?tab=roles')).toBe(true);
    expect(isSafeRelativeAppPath('//evil.example')).toBe(false);
    expect(isSafeRelativeAppPath('https://evil.example')).toBe(false);
    expect(isSafeRelativeAppPath('http://evil.example')).toBe(false);
    expect(isSafeRelativeAppPath('')).toBe(false);
    expect(isSafeRelativeAppPath('   ')).toBe(false);
    expect(isSafeRelativeAppPath('dashboard')).toBe(false);
  });

  it('safeReturnPathOrFallback prefers fallback when unsafe', () => {
    expect(safeReturnPathOrFallback('//evil', '/admins')).toBe('/admins');
    expect(safeReturnPathOrFallback('/admins', '/fallback')).toBe('/admins');
  });

  it('resolveReturnUrlFromQuery treats missing as fallback', () => {
    expect(resolveReturnUrlFromQuery(undefined, '/roles')).toBe('/roles');
    expect(resolveReturnUrlFromQuery('', '/roles')).toBe('/roles');
    expect(resolveReturnUrlFromQuery('//evil', '/roles')).toBe('/roles');
    expect(resolveReturnUrlFromQuery('/ok', '/roles')).toBe('/ok');
  });

  it('isSafeLoginReturnUrl excludes listed paths', () => {
    expect(isSafeLoginReturnUrl('/settings', ['/login', '/signup'])).toBe(true);
    expect(isSafeLoginReturnUrl('/login', ['/login'])).toBe(false);
    expect(isSafeLoginReturnUrl('/login/', ['/login'])).toBe(false);
  });
});
