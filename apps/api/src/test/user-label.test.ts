import { describe, expect, it } from 'vitest';

import { formatUserLabel } from '@metaboost/helpers';

describe('formatUserLabel', () => {
  it('formats username with displayName', () => {
    expect(
      formatUserLabel({
        username: 'bucket-admin',
        displayName: 'E2E Bucket Admin',
      })
    ).toBe('bucket-admin (E2E Bucket Admin)');
  });

  it('formats email with displayName when username is missing', () => {
    expect(
      formatUserLabel({
        email: 'e2e-bucket-admin@example.com',
        displayName: 'E2E Bucket Admin',
      })
    ).toBe('e2e-bucket-admin@example.com (E2E Bucket Admin)');
  });

  it('falls back to displayName when username and email are missing', () => {
    expect(
      formatUserLabel({
        displayName: 'E2E Bucket Admin',
      })
    ).toBe('E2E Bucket Admin');
  });

  it('returns em dash when all values are missing', () => {
    expect(formatUserLabel({})).toBe('—');
  });
});
