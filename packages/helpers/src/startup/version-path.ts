/**
 * Reusable startup/config helper for API version path.
 * Shared by API and management-api config.
 *
 * Normalizes to leading slash, no trailing slash (e.g. "v1" -> "/v1").
 */
export function normalizeVersionPath(raw: string): string {
  const s = raw.trim();
  const withLeading = s.startsWith('/') ? s : `/${s}`;
  return withLeading.endsWith('/') ? withLeading.slice(0, -1) : withLeading;
}
