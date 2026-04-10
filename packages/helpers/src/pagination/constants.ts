/**
 * Default page size for paginated list endpoints and list UIs (admins, events, etc.).
 * Used by management-api, management-web, and any other consumers that need a single source of truth.
 */
export const DEFAULT_PAGE_LIMIT = 20;

/**
 * Maximum allowed page size (limit) for standard paginated list endpoints.
 * Aligns with the largest value in DEFAULT_PAGE_LIMIT_OPTIONS. Use when clamping
 * the `limit` query param (e.g. Math.min(MAX_PAGE_SIZE, requestedLimit)).
 */
export const MAX_PAGE_SIZE = 100;

/**
 * Cap for the total count returned in paginated list responses. When the actual
 * total exceeds this, the API returns this value and may set truncatedTotal: true.
 * Keeps response size and UI totals predictable.
 */
export const MAX_TOTAL_CAP = 10_000;

/**
 * Standard limit options for "items per page" selects. Includes DEFAULT_PAGE_LIMIT.
 * Use when building limit-select UI so API, management-api, and UIs share the same options.
 */
export const DEFAULT_PAGE_LIMIT_OPTIONS: readonly { value: string; label: string }[] = [
  { value: '10', label: '10' },
  { value: '20', label: '20' },
  { value: '50', label: '50' },
  { value: '100', label: '100' },
];
