import type { Mb1PaymentRecipientStatus, Mb1PaymentVerificationLevel } from '@metaboost/orm';

import { faker } from '@faker-js/faker';

import { generateShortId } from '@metaboost/helpers';
import { MB1_PAYMENT_VERIFICATION_LEVELS } from '@metaboost/orm';

const CRUD_MASK_VALUES = [0, 1, 2, 3, 6, 7, 10, 11, 14, 15];

export type RecipientOutcomeDraft = {
  type: string;
  address: string;
  split: string;
  name: string | null;
  customKey: string | null;
  customValue: string | null;
  fee: boolean;
  status: Mb1PaymentRecipientStatus;
};

export type PaymentVerificationDraft = {
  verificationLevel: Mb1PaymentVerificationLevel;
  verifiedByApp: boolean;
  recipientVerifiedCount: number;
  recipientFailedCount: number;
  recipientUndeterminedCount: number;
  largestRecipientStatus: Mb1PaymentRecipientStatus;
};

export function makeNamespacedValue(namespace: string, value: string): string {
  return `${namespace}-${value}`;
}

export function randomShortId(): string {
  return generateShortId();
}

export function randomCrudMask(): number {
  return faker.helpers.arrayElement(CRUD_MASK_VALUES);
}

export function randomVerificationLevel(): Mb1PaymentVerificationLevel {
  return faker.helpers.arrayElement([...MB1_PAYMENT_VERIFICATION_LEVELS]);
}

export function assertCrudMask(label: string, value: number): void {
  if (!Number.isInteger(value) || value < 0 || value > 15) {
    throw new Error(`${label} must be an integer between 0 and 15, got: ${value}`);
  }
}

export function assertPositiveInteger(label: string, value: number): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${label} must be a positive integer, got: ${value}`);
  }
}

export function assertString(label: string, value: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must be non-empty`);
  }
}

export function assertVerificationCompatibility(
  verification: PaymentVerificationDraft,
  outcomes: RecipientOutcomeDraft[]
): void {
  const computed = countRecipientStatuses(outcomes);
  if (verification.recipientVerifiedCount !== computed.verified) {
    throw new Error(
      `recipientVerifiedCount mismatch: expected ${computed.verified}, got ${verification.recipientVerifiedCount}`
    );
  }
  if (verification.recipientFailedCount !== computed.failed) {
    throw new Error(
      `recipientFailedCount mismatch: expected ${computed.failed}, got ${verification.recipientFailedCount}`
    );
  }
  if (verification.recipientUndeterminedCount !== computed.undetermined) {
    throw new Error(
      `recipientUndeterminedCount mismatch: expected ${computed.undetermined}, got ${verification.recipientUndeterminedCount}`
    );
  }
  if (outcomes.length > 0) {
    const sorted = [...outcomes].sort(
      (a, b) => Number.parseFloat(b.split) - Number.parseFloat(a.split)
    );
    const largest = sorted[0];
    if (largest === undefined) {
      throw new Error('largest recipient is missing');
    }
    if (largest.status !== verification.largestRecipientStatus) {
      throw new Error(
        `largestRecipientStatus mismatch: expected ${largest.status}, got ${verification.largestRecipientStatus}`
      );
    }
  }
}

export function countRecipientStatuses(
  outcomes: RecipientOutcomeDraft[]
): Record<Mb1PaymentRecipientStatus, number> {
  const counts: Record<Mb1PaymentRecipientStatus, number> = {
    verified: 0,
    failed: 0,
    undetermined: 0,
  };
  for (const outcome of outcomes) {
    counts[outcome.status] += 1;
  }
  return counts;
}
