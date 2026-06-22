import type { MembershipTier } from '@metaboost/helpers';

import { resolveInitialMembershipExpiresAt, type PremiumBillingCadence } from '@metaboost/helpers';

import { readFreeTrialExpirationSeconds } from './freeTrialExpirationSeconds.js';

export type { PremiumBillingCadence };

/**
 * Default membership expiry when the caller does not pass an explicit `membershipExpiresAt`.
 * Trial: now + MEMBERSHIP_FREE_TRIAL_EXPIRATION (seconds).
 * Premium: +1 month (monthly cadence) or +12 months (annual cadence); defaults to annual when unspecified.
 */
export function resolveDefaultMembershipExpiresAt(options: {
  membershipTier: MembershipTier;
  premiumBillingCadence?: PremiumBillingCadence;
}): Date {
  return resolveInitialMembershipExpiresAt({
    membershipTier: options.membershipTier,
    premiumBillingCadence: options.premiumBillingCadence,
    trialExpirationSeconds: readFreeTrialExpirationSeconds(),
  });
}
