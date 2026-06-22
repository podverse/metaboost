import { describe, expect, it } from 'vitest';

import { cookieHeaderToHeaders } from './request.js';

describe('cookieHeaderToHeaders', () => {
  it('returns empty spread object for undefined', () => {
    expect(cookieHeaderToHeaders(undefined)).toEqual({});
  });

  it('returns empty spread object for empty string', () => {
    expect(cookieHeaderToHeaders('')).toEqual({});
  });

  it('returns Cookie header object for non-empty string', () => {
    expect(cookieHeaderToHeaders('k=v')).toEqual({ headers: { Cookie: 'k=v' } });
  });
});
