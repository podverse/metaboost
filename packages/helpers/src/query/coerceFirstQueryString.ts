/**
 * First string value from Express-style `req.query` entries or a single string
 * (`string` or `string[]` from repeated keys). Trims the result.
 */
export function coerceFirstQueryString(value: unknown): string | undefined {
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
