import { MembershipTier, MEMBERSHIP_TIER_VALUES } from './constants.js';

/**
 * Maps a persisted `membership_tier` string (ORM column is `string`) to the public enum.
 * Returns null when the value is absent (e.g. no trust-settings row loaded).
 */
export function membershipTierFromStoredValue(
  value: string | null | undefined
): MembershipTier | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  for (const tier of MEMBERSHIP_TIER_VALUES) {
    if (value === tier) {
      return tier;
    }
  }
  return MembershipTier.Trial;
}
