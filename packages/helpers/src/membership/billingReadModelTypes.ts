import type { ResolvedProductMembership } from './resolvedProductMembership.js';

/**
 * ISO 4217 currency code for list-priced premium tiers returned by public billing read models.
 * Catalog rows currently store USD; clients must not assume user-settled currency for upgrades.
 */
export const BILLING_LIST_PRICE_CURRENCY_CODE = 'USD' as const;

/**
 * Public (unauthenticated) product/membership read model for marketing and signup flows.
 * Resolved DB-first on the server; env seeds gaps only. Same numeric fields as
 * `ResolvedProductMembership`, flattened under `data` (Podverse parity).
 */
export type PublicProductMembershipReadModelData = ResolvedProductMembership & {
  listPriceCurrencyCode: typeof BILLING_LIST_PRICE_CURRENCY_CODE;
  /**
   * Mirrors account signup mode: when false, anonymous clients must not treat premium list prices
   * as actionable for self-serve signup (admin provisioning only).
   */
  selfServePublicSignupOpen: boolean;
};

export type BillingRenewalLastStatus = 'none' | 'succeeded' | 'failed';

/**
 * Authenticated user billing snapshot plus resolved catalog pricing (no PII).
 */
export type AuthenticatedBillingMembershipReadModelData = {
  listPriceCurrencyCode: typeof BILLING_LIST_PRICE_CURRENCY_CODE;
  membership: {
    tier: string;
    /** ISO 8601 UTC instant; null when unset. */
    expiresAtIso: string | null;
    premiumBillingCadence: 'monthly' | 'annual' | null;
    autoRenewMode: 'off' | 'on';
  };
  renewal: {
    lastStatus: BillingRenewalLastStatus;
    /** ISO 8601 UTC instant; null when never attempted. */
    lastAttemptAtIso: string | null;
    /** ISO 8601 UTC instant; null when no retry scheduled. */
    nextAttemptAtIso: string | null;
    retryCount: number;
  };
  catalog: ResolvedProductMembership;
};
