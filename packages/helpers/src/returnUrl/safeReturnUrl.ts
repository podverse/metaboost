/**
 * Validates same-origin navigation targets passed through query strings (open-redirect mitigation).
 * Allows only paths that begin with a single slash (same-origin relative), not scheme URLs or
 * protocol-relative (`//`) links.
 */

/**
 * Returns true if `path` looks like an app-internal absolute path (`/foo`), not `//evil` or `http(s):`.
 */
export function isSafeRelativeAppPath(path: string): boolean {
  const trimmed = path.trim();
  if (trimmed === '') return false;
  return trimmed.startsWith('/') && !trimmed.startsWith('//');
}

/**
 * Returns `candidate.trim()` when `isSafeRelativeAppPath(candidate)` is true; otherwise `fallback`.
 */
export function safeReturnPathOrFallback(candidate: string, fallback: string): string {
  return isSafeRelativeAppPath(candidate) ? candidate.trim() : fallback;
}

/**
 * Resolves an optional URL query value for post-action navigation:
 * missing/blank → fallback; unsafe → fallback; otherwise trimmed safe path.
 */
export function resolveReturnUrlFromQuery(raw: string | undefined, fallback: string): string {
  if (raw === undefined || raw.trim() === '') {
    return fallback;
  }
  return safeReturnPathOrFallback(raw, fallback);
}

/**
 * Normalizes a path for comparison with route constants (strip query/hash, trim trailing slashes except root).
 */
export function normalizedPathnameForReturnComparison(url: string): string {
  const trimmed = url.trim();
  const pathOnly = trimmed.split('?')[0]?.split('#')[0] ?? trimmed;
  const withoutTrailingSlash = pathOnly.replace(/\/+$/, '');
  return withoutTrailingSlash === '' ? '/' : withoutTrailingSlash;
}

/**
 * Login/signup redirect guard: internal path only, excluding normalized auth routes (avoid redirect loops).
 */
export function isSafeLoginReturnUrl(
  url: string,
  excludedNormalizedPaths: readonly string[]
): boolean {
  if (!isSafeRelativeAppPath(url)) return false;
  const norm = normalizedPathnameForReturnComparison(url);
  return !excludedNormalizedPaths.some((ex) => normalizedPathnameForReturnComparison(ex) === norm);
}
