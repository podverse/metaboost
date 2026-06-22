import { DEFAULT_FREE_TRIAL_EXPIRATION } from '@metaboost/helpers';

/**
 * `MEMBERSHIP_FREE_TRIAL_EXPIRATION` is an optional non-negative integer — **seconds**.
 * Unset uses the same default as `@metaboost/helpers` {@link DEFAULT_FREE_TRIAL_EXPIRATION}.
 */
function parseOptionalPositiveExpirationSeconds(name: string, defaultSeconds: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === null || String(raw).trim() === '') {
    return defaultSeconds;
  }
  const n = Number(String(raw).trim());
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) {
    throw new TypeError(`${name} must be a positive integer (seconds), received: ${String(raw)}`);
  }
  return n;
}

/** Trial-tier default membership window duration from env `MEMBERSHIP_FREE_TRIAL_EXPIRATION` (seconds). */
export function readFreeTrialExpirationSeconds(): number {
  return parseOptionalPositiveExpirationSeconds(
    'MEMBERSHIP_FREE_TRIAL_EXPIRATION',
    DEFAULT_FREE_TRIAL_EXPIRATION
  );
}
