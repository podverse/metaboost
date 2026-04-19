import { coerceFirstQueryString } from './coerceFirstQueryString.js';

/**
 * Parses a required non-empty query string from an Express-style query value.
 * Returns undefined when missing or empty.
 */
export function parseRequiredQueryStringParam(value: unknown): string | undefined {
  const raw = coerceFirstQueryString(value);
  if (raw === undefined || raw === '') {
    return undefined;
  }
  return raw;
}
