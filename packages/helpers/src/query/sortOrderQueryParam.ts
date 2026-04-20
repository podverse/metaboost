import { coerceFirstQueryString } from './coerceFirstQueryString.js';

export type AscDescSortOrder = 'asc' | 'desc';

/**
 * Type guard for table sort order query / API string values.
 */
export function isAscDescSortOrder(value: string): value is AscDescSortOrder {
  return value === 'asc' || value === 'desc';
}

/**
 * Parses `sortOrder` from Express `req.query` (or any `string` / `string[]` / unknown).
 * Returns `undefined` when missing or not exactly `asc` or `desc`.
 */
export function parseSortOrderQueryParam(value: unknown): AscDescSortOrder | undefined {
  const s = coerceFirstQueryString(value);
  if (s === undefined) {
    return undefined;
  }
  return isAscDescSortOrder(s) ? s : undefined;
}
