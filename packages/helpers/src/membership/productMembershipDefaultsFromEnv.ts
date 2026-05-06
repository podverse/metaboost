/**
 * Env-only fallbacks for membership product defaults (same keys as API/management-api startup validation).
 * Lenient parsing: invalid optional env falls back to defaults (safe for HTTP handlers).
 *
 * Runtime resolution is DB-first: `BillingPriceCatalogService.resolveProductMembership` and
 * `ProductMembershipSettingsService` read `product_membership_settings` and active premium prices;
 * these env values apply when inserting missing rows only (`ON CONFLICT DO NOTHING` / gap-fill pricing).
 */

/** Default trial duration when `MEMBERSHIP_FREE_TRIAL_EXPIRATION` is unset (seconds; see env-expiration-naming skill). */
export const DEFAULT_FREE_TRIAL_EXPIRATION = 31 * 24 * 60 * 60;

export type ProductMembershipDefaultsFromEnv = {
  freeTrialExpirationSeconds: number;
  premiumMembershipCostMonthly: number;
  premiumMembershipCostAnnually: number;
};

/** Defaults when env vars are unset; shared by `resolveProductMembershipDefaultsFromEnv` and browser fallbacks. */
export const PRODUCT_MEMBERSHIP_DEFAULTS_FROM_ENV_FALLBACK: ProductMembershipDefaultsFromEnv = {
  freeTrialExpirationSeconds: DEFAULT_FREE_TRIAL_EXPIRATION,
  premiumMembershipCostMonthly: 3,
  premiumMembershipCostAnnually: 30,
};

function parseNonNegativeNumberEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') {
    return fallback;
  }
  const n = Number(String(raw).trim());
  if (!Number.isFinite(n) || n < 0) {
    return fallback;
  }
  return n;
}

function parsePositiveIntegerTrialExpiration(name: string, fallbackExpiration: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === null || String(raw).trim() === '') {
    return fallbackExpiration;
  }
  const n = Number(String(raw).trim());
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) {
    return fallbackExpiration;
  }
  return n;
}

/** Non-secret product defaults for admin UIs and optional main-app mirrors. */
export function resolveProductMembershipDefaultsFromEnv(): ProductMembershipDefaultsFromEnv {
  return {
    freeTrialExpirationSeconds: parsePositiveIntegerTrialExpiration(
      'MEMBERSHIP_FREE_TRIAL_EXPIRATION',
      PRODUCT_MEMBERSHIP_DEFAULTS_FROM_ENV_FALLBACK.freeTrialExpirationSeconds
    ),
    premiumMembershipCostMonthly: parseNonNegativeNumberEnv(
      'MEMBERSHIP_PREMIUM_COST_MONTHLY',
      PRODUCT_MEMBERSHIP_DEFAULTS_FROM_ENV_FALLBACK.premiumMembershipCostMonthly
    ),
    premiumMembershipCostAnnually: parseNonNegativeNumberEnv(
      'MEMBERSHIP_PREMIUM_COST_ANNUALLY',
      PRODUCT_MEMBERSHIP_DEFAULTS_FROM_ENV_FALLBACK.premiumMembershipCostAnnually
    ),
  };
}
