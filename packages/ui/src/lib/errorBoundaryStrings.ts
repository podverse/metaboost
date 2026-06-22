function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Keeps only string-valued entries from an optional object (e.g. `errors` from i18n JSON).
 */
export function filterErrorStrings(
  obj: Record<string, unknown> | undefined
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj || {})) {
    if (typeof value === 'string') {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Reads `messages.errors` from a loaded next-intl-style module default export.
 */
export function extractErrorsStringsFromMessagesDefault(messages: unknown): Record<string, string> {
  if (!isPlainRecord(messages)) {
    return {};
  }
  const errorsUnknown: unknown = messages.errors;
  if (!isPlainRecord(errorsUnknown)) {
    return {};
  }
  return filterErrorStrings(errorsUnknown);
}
