import type { PremiumBillingCadence } from './premiumBillingCadence.js';

/**
 * Vendor-agnostic cadence label for premium membership period math.
 * Alias of {@link PremiumBillingCadence} for billing catalog alignment.
 */
export type BillingCadence = PremiumBillingCadence;

export const BILLING_PRODUCT_CODE_MEMBERSHIP_PREMIUM = 'membership_premium' as const;

export type BillingProductCode = typeof BILLING_PRODUCT_CODE_MEMBERSHIP_PREMIUM;

/** Reasons for membership period mutations (orchestration and audit contracts). */
export type MembershipPeriodExtensionReason =
  | 'initial_default'
  | 'tier_change_default'
  | 'payment_settled'
  | 'pay_on_demand_extension'
  | 'renewal_success'
  | 'admin_adjustment';
