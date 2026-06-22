import { describe, expect, it } from 'vitest';

import { MembershipTier } from '../trust/constants.js';
import {
  extendMembershipPeriodByCadence,
  extendMembershipPeriodByMonths,
  membershipExtensionBaseDate,
  monthsForPremiumCadence,
  resolveInitialMembershipExpiresAt,
} from './membershipPeriodPolicy.js';

describe('membershipPeriodPolicy', () => {
  describe('monthsForPremiumCadence', () => {
    it('maps monthly and annual', () => {
      expect(monthsForPremiumCadence('monthly')).toBe(1);
      expect(monthsForPremiumCadence('annual')).toBe(12);
    });
  });

  describe('membershipExtensionBaseDate', () => {
    it('uses now when expiry is null', () => {
      const now = new Date(2026, 4, 5, 12, 0, 0);
      expect(membershipExtensionBaseDate(null, now).getTime()).toBe(now.getTime());
    });

    it('uses now when expiry is in the past', () => {
      const now = new Date(2026, 4, 5, 12, 0, 0);
      const past = new Date(2025, 0, 1);
      expect(membershipExtensionBaseDate(past, now).getTime()).toBe(now.getTime());
    });

    it('uses existing expiry when still active', () => {
      const now = new Date(2026, 4, 5, 12, 0, 0);
      const future = new Date(2027, 0, 1);
      expect(membershipExtensionBaseDate(future, now).getTime()).toBe(future.getTime());
    });
  });

  describe('extendMembershipPeriodByCadence', () => {
    it('stacks monthly from active expiry', () => {
      const now = new Date(2026, 4, 5, 12, 0, 0);
      const expiry = new Date(2026, 5, 10);
      const next = extendMembershipPeriodByCadence({
        membershipExpiresAt: expiry,
        cadence: 'monthly',
        now,
      });
      expect(next.getFullYear()).toBe(2026);
      expect(next.getMonth()).toBe(6);
      expect(next.getDate()).toBe(10);
    });

    it('Jan 31 + 1 month clamps to Feb end (leap year)', () => {
      const now = new Date(2024, 0, 15);
      const jan31 = new Date(2024, 0, 31);
      const next = extendMembershipPeriodByCadence({
        membershipExpiresAt: jan31,
        cadence: 'monthly',
        now,
      });
      expect(next.getFullYear()).toBe(2024);
      expect(next.getMonth()).toBe(1);
      expect(next.getDate()).toBe(29);
    });

    it('Mar 31 + 1 month clamps to Apr 30', () => {
      const now = new Date(2026, 2, 15);
      const mar31 = new Date(2026, 2, 31);
      const next = extendMembershipPeriodByCadence({
        membershipExpiresAt: mar31,
        cadence: 'monthly',
        now,
      });
      expect(next.getFullYear()).toBe(2026);
      expect(next.getMonth()).toBe(3);
      expect(next.getDate()).toBe(30);
    });
  });

  describe('extendMembershipPeriodByMonths', () => {
    it('adds arbitrary months from extension base', () => {
      const now = new Date(2026, 4, 5);
      const next = extendMembershipPeriodByMonths({
        membershipExpiresAt: null,
        monthsToAdd: 3,
        now,
      });
      expect(next.getFullYear()).toBe(2026);
      expect(next.getMonth()).toBe(7);
      expect(next.getDate()).toBe(5);
    });
  });

  describe('resolveInitialMembershipExpiresAt', () => {
    it('premium monthly adds one calendar month from now', () => {
      const now = new Date(2026, 0, 15, 10, 0, 0);
      const d = resolveInitialMembershipExpiresAt({
        membershipTier: MembershipTier.Premium,
        premiumBillingCadence: 'monthly',
        trialExpirationSeconds: 86400,
        now,
      });
      expect(d.getFullYear()).toBe(2026);
      expect(d.getMonth()).toBe(1);
      expect(d.getDate()).toBe(15);
    });

    it('premium defaults to annual cadence when omitted', () => {
      const now = new Date(2026, 0, 15);
      const d = resolveInitialMembershipExpiresAt({
        membershipTier: MembershipTier.Premium,
        trialExpirationSeconds: 1,
        now,
      });
      expect(d.getFullYear()).toBe(2027);
      expect(d.getMonth()).toBe(0);
      expect(d.getDate()).toBe(15);
    });

    it('trial adds seconds', () => {
      const now = new Date(2026, 4, 5, 12, 0, 0);
      const d = resolveInitialMembershipExpiresAt({
        membershipTier: MembershipTier.Trial,
        trialExpirationSeconds: 3600,
        now,
      });
      expect(d.getTime()).toBe(now.getTime() + 3600 * 1000);
    });
  });
});
