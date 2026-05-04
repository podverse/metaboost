/**
 * Podverse-aligned entitlement capability keys for trust / auth gating. Keep string values in sync
 * with `@podverse/helpers` `ACCOUNT_ENTITLEMENT_CAPABILITY`.
 */
export const ACCOUNT_ENTITLEMENT_CAPABILITY = {
  allowDirectoryAddByRSS: 'allowDirectoryAddByRSS',
  maxAddByRSSFeeds: 'maxAddByRSSFeeds',
  maxManualRefreshesPerHour: 'maxManualRefreshesPerHour',
  trackStats: 'trackStats',
  allowNotifications: 'allowNotifications',
} as const;

export type AccountEntitlementCapability =
  (typeof ACCOUNT_ENTITLEMENT_CAPABILITY)[keyof typeof ACCOUNT_ENTITLEMENT_CAPABILITY];
