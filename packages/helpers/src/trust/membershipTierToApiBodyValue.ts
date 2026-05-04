import { MembershipTier } from './constants.js';

/** Wire format for management-api POST/PATCH `membershipTier` (Joi `MEMBERSHIP_TIER_VALUES`). */
export function membershipTierToApiBodyValue(tier: MembershipTier): 'trial' | 'premium' {
  return tier === MembershipTier.Premium ? 'premium' : 'trial';
}
