import type { BillingCadence } from './billingDomain.js';

export type BillingRenewalAttemptResult =
  | { status: 'succeeded'; providerAttemptId?: string }
  | { status: 'failed'; providerAttemptId?: string; retryAfterSeconds?: number };

/**
 * Provider-agnostic renewal boundary (Stripe, internal ledger, etc.).
 * Implementations must treat `idempotencyKey` as a dedupe key for charge attempts.
 */
export interface BillingRenewalProviderAdapter {
  attemptRenewal(params: {
    userId: string;
    cadence: BillingCadence;
    idempotencyKey: string;
  }): Promise<BillingRenewalAttemptResult>;
}

export function createStubBillingRenewalProviderAdapter(): BillingRenewalProviderAdapter {
  return {
    async attemptRenewal() {
      return { status: 'succeeded', providerAttemptId: 'stub' };
    },
  };
}
