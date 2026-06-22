import type {
  AuthenticatedBillingMembershipReadModelData,
  BillingRenewalLastStatus,
  PublicProductMembershipReadModelData,
  ResolvedProductMembership,
} from '@metaboost/helpers';
import type { UserWithRelations } from '@metaboost/orm';

import { BILLING_LIST_PRICE_CURRENCY_CODE } from '@metaboost/helpers';

export function toIsoUtcOrNull(value: Date | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  return value.toISOString();
}

export function renewalLastStatusFromStored(raw: string): BillingRenewalLastStatus {
  if (raw === 'succeeded' || raw === 'failed' || raw === 'none') {
    return raw;
  }
  return 'none';
}

export function premiumBillingCadenceFromTrust(raw: string | null): 'monthly' | 'annual' | null {
  if (raw === 'monthly' || raw === 'annual') {
    return raw;
  }
  return null;
}

export function buildPublicProductMembershipReadModel(params: {
  resolvedProductMembership: ResolvedProductMembership;
  selfServePublicSignupOpen: boolean;
}): PublicProductMembershipReadModelData {
  return {
    ...params.resolvedProductMembership,
    listPriceCurrencyCode: BILLING_LIST_PRICE_CURRENCY_CODE,
    selfServePublicSignupOpen: params.selfServePublicSignupOpen,
  };
}

export function buildAuthenticatedBillingMembershipReadModel(params: {
  user: UserWithRelations;
  catalog: ResolvedProductMembership;
}): AuthenticatedBillingMembershipReadModelData {
  const trust = params.user.trustSettings;
  if (trust === undefined) {
    throw new Error('buildAuthenticatedBillingMembershipReadModel: missing trust settings');
  }
  return {
    listPriceCurrencyCode: BILLING_LIST_PRICE_CURRENCY_CODE,
    membership: {
      tier: trust.membershipTier,
      expiresAtIso: toIsoUtcOrNull(trust.membershipExpiresAt),
      premiumBillingCadence: premiumBillingCadenceFromTrust(trust.billingCadence),
      autoRenewMode: trust.autoRenewMode,
    },
    renewal: {
      lastStatus: renewalLastStatusFromStored(trust.lastRenewalStatus),
      lastAttemptAtIso: toIsoUtcOrNull(trust.lastRenewalAttemptAt),
      nextAttemptAtIso: toIsoUtcOrNull(trust.nextRenewalAttemptAt),
      retryCount: trust.renewalRetryCount,
    },
    catalog: params.catalog,
  };
}
