import { describe, expect, it } from 'vitest';

import { MembershipTier } from './constants.js';
import { membershipTierFromStoredValue } from './membershipTierFromStoredValue.js';

describe('membershipTierFromStoredValue', () => {
  it('returns null for missing or empty', () => {
    expect(membershipTierFromStoredValue(undefined)).toBe(null);
    expect(membershipTierFromStoredValue(null)).toBe(null);
    expect(membershipTierFromStoredValue('')).toBe(null);
  });

  it('maps known tier strings', () => {
    expect(membershipTierFromStoredValue('trial')).toBe(MembershipTier.Trial);
    expect(membershipTierFromStoredValue('premium')).toBe(MembershipTier.Premium);
  });

  it('defaults unknown values to trial', () => {
    expect(membershipTierFromStoredValue('legacy_or_corrupt')).toBe(MembershipTier.Trial);
  });
});
