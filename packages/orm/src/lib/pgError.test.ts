import { describe, expect, it } from 'vitest';

import { getPgErrorCode, isPgUniqueViolation } from './pgError.js';

describe('getPgErrorCode', () => {
  it('returns undefined for null, undefined, and non-objects', () => {
    expect(getPgErrorCode(null)).toBeUndefined();
    expect(getPgErrorCode(undefined)).toBeUndefined();
    expect(getPgErrorCode('23505')).toBeUndefined();
    expect(getPgErrorCode(1)).toBeUndefined();
  });

  it('returns undefined when code is missing or not a string', () => {
    expect(getPgErrorCode({})).toBeUndefined();
    expect(getPgErrorCode({ code: 23505 })).toBeUndefined();
  });

  it('returns string codes when present', () => {
    expect(getPgErrorCode({ code: '23505' })).toBe('23505');
    expect(getPgErrorCode({ code: '23503' })).toBe('23503');
  });
});

describe('isPgUniqueViolation', () => {
  it('is true only when code is the unique_violation string', () => {
    expect(isPgUniqueViolation({ code: '23505' })).toBe(true);
    expect(isPgUniqueViolation({ code: '23503' })).toBe(false);
    expect(isPgUniqueViolation({ code: 23505 })).toBe(false);
    expect(isPgUniqueViolation(null)).toBe(false);
    expect(isPgUniqueViolation(undefined)).toBe(false);
  });
});
