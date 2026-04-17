import { describe, expect, it } from 'vitest';

import { hashRequestBody } from './hashRequestBody.js';

describe('hashRequestBody', () => {
  it('returns lowercase hex SHA-256 of exact bytes', () => {
    expect(hashRequestBody(Buffer.from(''))).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    );
    expect(hashRequestBody(Buffer.from('hello'))).toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'
    );
  });

  it('accepts Uint8Array', () => {
    const u8 = new Uint8Array([104, 105]);
    expect(hashRequestBody(u8)).toHaveLength(64);
  });
});
