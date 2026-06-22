import type { BillingCadence } from './billingDomain.js';
import type { PremiumBillingCadence } from './premiumBillingCadence.js';

import { addMonths } from '../time/addMonths.js';
import { MembershipTier } from '../trust/constants.js';

/**
 * Whole months to add for a premium cadence (calendar-month clamp via {@link addMonths}).
 */
export function monthsForPremiumCadence(cadence: BillingCadence): number {
  return cadence === 'monthly' ? 1 : 12;
}

/**
 * Base instant for stacking the next period: extend from current expiry while active,
 * otherwise from `now` when expired or unset.
 */
export function membershipExtensionBaseDate(
  membershipExpiresAt: Date | null | undefined,
  now: Date
): Date {
  if (membershipExpiresAt === null || membershipExpiresAt === undefined) {
    return now;
  }
  return membershipExpiresAt.getTime() > now.getTime() ? membershipExpiresAt : now;
}

export function extendMembershipPeriodByCadence(params: {
  membershipExpiresAt: Date | null | undefined;
  cadence: BillingCadence;
  now?: Date;
}): Date {
  const now = params.now ?? new Date();
  const base = membershipExtensionBaseDate(params.membershipExpiresAt, now);
  return addMonths(base, monthsForPremiumCadence(params.cadence));
}

export function extendMembershipPeriodByMonths(params: {
  membershipExpiresAt: Date | null | undefined;
  monthsToAdd: number;
  now?: Date;
}): Date {
  const now = params.now ?? new Date();
  const base = membershipExtensionBaseDate(params.membershipExpiresAt, now);
  return addMonths(base, params.monthsToAdd);
}

/**
 * Default expiry for a newly created trust settings row when the caller does not pass an explicit
 * `membershipExpiresAt`. Trial: `now + trialExpirationSeconds`. Premium: `now` plus cadence months
 * (defaults to annual when cadence is omitted).
 */
export function resolveInitialMembershipExpiresAt(params: {
  membershipTier: MembershipTier;
  premiumBillingCadence?: PremiumBillingCadence;
  trialExpirationSeconds: number;
  now?: Date;
}): Date {
  const now = params.now ?? new Date();
  if (params.membershipTier === MembershipTier.Premium) {
    const cadence = params.premiumBillingCadence ?? 'annual';
    return addMonths(now, monthsForPremiumCadence(cadence));
  }
  return new Date(now.getTime() + params.trialExpirationSeconds * 1000);
}
