import { describe, expect, it } from 'vitest';

import {
  ROUTES,
  bucketPathFromAncestry,
  isPublicPath,
  loginRoute,
  parseBucketPath,
} from './routes';

describe('routes helpers', () => {
  it('bucketPathFromAncestry builds nested paths', () => {
    expect(bucketPathFromAncestry([])).toBe('/bucket');
    expect(bucketPathFromAncestry(['a', 'b'])).toBe('/bucket/a/bucket/b');
  });

  it('parseBucketPath extracts ancestry segments', () => {
    expect(parseBucketPath('/bucket/x/bucket/y')).toEqual(['x', 'y']);
    expect(parseBucketPath('/bucket/a/settings')).toEqual(['a']);
    expect(parseBucketPath('/dashboard')).toBeNull();
  });

  it('isPublicPath allows listed and legacy prefixes', () => {
    expect(isPublicPath(ROUTES.LOGIN)).toBe(true);
    expect(isPublicPath('/b/foo')).toBe(true);
    expect(isPublicPath('/invite/token')).toBe(true);
    expect(isPublicPath('/dashboard')).toBe(false);
  });

  it('loginRoute adds returnUrl only for safe relative paths', () => {
    expect(loginRoute()).toBe(ROUTES.LOGIN);
    expect(loginRoute('/dashboard')).toContain('returnUrl');
    expect(loginRoute('https://evil.example/foo')).toBe(ROUTES.LOGIN);
  });
});
