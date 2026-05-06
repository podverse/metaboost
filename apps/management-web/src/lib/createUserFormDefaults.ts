import type {
  MembershipTier,
  PremiumBillingCadence,
  ResolvedProductMembership,
} from '@metaboost/helpers';

import {
  DEFAULT_FREE_TRIAL_EXPIRATION,
  PRODUCT_MEMBERSHIP_DEFAULTS_FROM_ENV_FALLBACK,
  resolveInitialMembershipExpiresAt,
  toDateTimeLocalValue,
} from '@metaboost/helpers';

export const STORAGE_EXPIRY_KEY = 'metaboost-mgmt-create-user-membership-expires-at';
export const STORAGE_CADENCE_KEY = 'metaboost-mgmt-create-user-premium-cadence';

/** Client fallback when management-api is unreachable; matches `resolveProductMembershipDefaultsFromEnv` bootstrap numbers. */
export function fallbackProductMembershipFromEnv(): ResolvedProductMembership {
  return { ...PRODUCT_MEMBERSHIP_DEFAULTS_FROM_ENV_FALLBACK };
}

/**
 * Default datetime-local value aligned with server defaults (trial: `trialExpirationSeconds`;
 * premium: +1 or +12 months via membership period policy).
 */
export function computeDefaultMembershipExpiresAtInput(options: {
  membershipTier: MembershipTier;
  premiumBillingCadence: PremiumBillingCadence;
  trialExpirationSeconds: number;
}): string {
  const sec =
    options.trialExpirationSeconds > 0
      ? options.trialExpirationSeconds
      : DEFAULT_FREE_TRIAL_EXPIRATION;
  const d = resolveInitialMembershipExpiresAt({
    membershipTier: options.membershipTier,
    premiumBillingCadence: options.premiumBillingCadence,
    trialExpirationSeconds: sec,
  });
  return toDateTimeLocalValue(d);
}
