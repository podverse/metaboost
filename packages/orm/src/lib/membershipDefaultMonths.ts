const MIN_MONTHS = 1;
const MAX_MONTHS = 120;

const DEFAULT_TRIAL_MONTHS = 3;
const DEFAULT_PREMIUM_MONTHS = 12;

function parseMembershipMonthsEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') {
    return fallback;
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < MIN_MONTHS || n > MAX_MONTHS) {
    throw new Error(
      `${name} must be an integer from ${String(MIN_MONTHS)} to ${String(MAX_MONTHS)}, received: ${String(raw)}`
    );
  }
  return n;
}

/** Months added for default trial-tier expiry (`MEMBERSHIP_DEFAULT_TRIAL_MONTHS`, default 3). */
export function membershipDefaultTrialMonths(): number {
  return parseMembershipMonthsEnv('MEMBERSHIP_DEFAULT_TRIAL_MONTHS', DEFAULT_TRIAL_MONTHS);
}

/** Months added for default premium-tier expiry (`MEMBERSHIP_DEFAULT_PREMIUM_MONTHS`, default 12). */
export function membershipDefaultPremiumMonths(): number {
  return parseMembershipMonthsEnv('MEMBERSHIP_DEFAULT_PREMIUM_MONTHS', DEFAULT_PREMIUM_MONTHS);
}
