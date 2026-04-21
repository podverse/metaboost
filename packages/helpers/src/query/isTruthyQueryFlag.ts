import { coerceFirstQueryString } from './coerceFirstQueryString.js';

/**
 * Parses common HTTP query boolean flags enabled with literal `true` or `1`.
 * Use on `req.query` entries and URLSearchParams/search param strings.
 */
export function isTruthyQueryFlag(value: unknown): boolean {
  const scalar = coerceFirstQueryString(value);
  return scalar === 'true' || scalar === '1';
}
