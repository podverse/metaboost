import { isNonNegativeInteger } from '../number/isNonNegativeInteger.js';
import { coerceFirstQueryString } from './coerceFirstQueryString.js';

/**
 * Parses a non-negative integer from an Express-style query value.
 * Returns undefined when the value is missing, empty, non-numeric, or negative.
 */
export function parseNonNegativeIntegerQueryParam(value: unknown): number | undefined {
  const raw = coerceFirstQueryString(value);
  if (raw === undefined || raw === '') {
    return undefined;
  }

  const parsed = Number(raw);
  if (!isNonNegativeInteger(parsed)) {
    return undefined;
  }

  return parsed;
}
