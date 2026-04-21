import { parseNonNegativeIntegerQueryParam } from './parseNonNegativeIntegerQueryParam.js';

/**
 * Alias of parseNonNegativeIntegerQueryParam for required integer-style fields.
 * Callers typically treat undefined as "missing/invalid" and return 400.
 */
export function parseRequiredNonNegativeIntegerQueryParam(value: unknown): number | undefined {
  return parseNonNegativeIntegerQueryParam(value);
}
