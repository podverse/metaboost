export enum AccountTrustTier {
  Untrusted = 1,
  Trusted = 2,
}

export const ACCOUNT_TRUST_TIER_VALUES = [
  AccountTrustTier.Untrusted,
  AccountTrustTier.Trusted,
] as const;

export enum MembershipTier {
  Trial = 'trial',
  Premium = 'premium',
}

export const MEMBERSHIP_TIER_VALUES = [MembershipTier.Trial, MembershipTier.Premium] as const;
