/** First string value from Express-style query (`string` or `string[]` from repeated keys). */
function coerceFirstQueryString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (Array.isArray(value)) {
    const first = value[0];
    if (typeof first === 'string') {
      return first.trim();
    }
  }
  return undefined;
}

/**
 * Parses common HTTP query boolean flags enabled with literal `true` or `1`.
 * Use on `req.query` entries and URLSearchParams/search param strings.
 */
export function isTruthyQueryFlag(value: unknown): boolean {
  const scalar = coerceFirstQueryString(value);
  return scalar === 'true' || scalar === '1';
}
