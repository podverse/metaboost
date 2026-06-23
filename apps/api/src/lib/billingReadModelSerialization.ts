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

export function premiumBillingCadenceFromMembership(
  raw: string | null
): 'monthly' | 'annual' | null {
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
  const membership = params.user.membership;
  if (membership === undefined || membership === null) {
    throw new Error('buildAuthenticatedBillingMembershipReadModel: missing membership');
  }
  return {
    listPriceCurrencyCode: BILLING_LIST_PRICE_CURRENCY_CODE,
    membership: {
      tier: membership.membershipTier,
      expiresAtIso: toIsoUtcOrNull(membership.membershipExpiresAt),
      premiumBillingCadence: premiumBillingCadenceFromMembership(membership.billingCadence),
      autoRenewMode: membership.autoRenewMode,
    },
    renewal: {
      lastStatus: renewalLastStatusFromStored(membership.lastRenewalStatus),
      lastAttemptAtIso: toIsoUtcOrNull(membership.lastRenewalAttemptAt),
      nextAttemptAtIso: toIsoUtcOrNull(membership.nextRenewalAttemptAt),
      retryCount: membership.renewalRetryCount,
    },
    catalog: params.catalog,
  };
}
