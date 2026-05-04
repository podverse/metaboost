import { describe, expect, it } from 'vitest';

import { MembershipTier } from './constants.js';
import { membershipTierToApiBodyValue } from './membershipTierToApiBodyValue.js';

describe('membershipTierToApiBodyValue', () => {
  it('maps enum members to API literals', () => {
    expect(membershipTierToApiBodyValue(MembershipTier.Trial)).toBe('trial');
    expect(membershipTierToApiBodyValue(MembershipTier.Premium)).toBe('premium');
  });
});
