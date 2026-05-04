export enum MembershipTier {
  Trial = 'trial',
  Premium = 'premium',
}

export const MEMBERSHIP_TIER_VALUES = [MembershipTier.Trial, MembershipTier.Premium] as const;
