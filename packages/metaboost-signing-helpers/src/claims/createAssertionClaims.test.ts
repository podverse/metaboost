import { describe, expect, it } from 'vitest';

import { APP_ASSERTION_MAX_TTL_SECONDS } from '../types.js';
import { createAssertionClaims } from './createAssertionClaims.js';

const validBh = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

describe('createAssertionClaims', () => {
  it('returns canonical claims on valid input', () => {
    const c = createAssertionClaims({
      iss: '  my-app  ',
      iat: 1_700_000_000,
      exp: 1_700_000_100,
      jti: '550e8400-e29b-41d4-a716-446655440000',
      m: 'POST',
      p: '/v1/standard/mbrss-v1/boost/x',
      bh: validBh.toUpperCase(),
    });
    expect(c.iss).toBe('my-app');
    expect(c.bh).toBe(validBh);
    expect(c.m).toBe('POST');
  });

  it('rejects TTL above max', () => {
    expect(() =>
      createAssertionClaims({
        iss: 'a',
        iat: 100,
        exp: 100 + APP_ASSERTION_MAX_TTL_SECONDS + 1,
        jti: 'j',
        m: 'POST',
        p: '/v1/standard/x',
        bh: validBh,
      })
    ).toThrow(/at most/);
  });

  it('rejects non-POST method', () => {
    expect(() =>
      createAssertionClaims({
        iss: 'a',
        iat: 1,
        exp: 10,
        jti: 'j',
        m: 'GET',
        p: '/v1/standard/x',
        bh: validBh,
      })
    ).toThrow(/POST/);
  });
});
