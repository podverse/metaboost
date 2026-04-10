/**
 * Client-side rate limit retry time. The backend is the source of truth: it returns
 * Retry-After (seconds until the rate limit window resets). This helper returns that
 * value when present; otherwise a fallback so the UI can still show a message.
 * Reusable by any app that calls rate-limited endpoints (web, management-web, etc.).
 */

/** Fallback (seconds) when server does not send Retry-After; should match API window (e.g. 15 min). */
const DEFAULT_WINDOW_SECONDS = 15 * 60;

/**
 * Returns seconds until the client can retry the given rate-limited action.
 * Prefers serverRetryAfterSeconds from the 429 response (Retry-After header); when
 * absent (e.g. legacy API), returns DEFAULT_WINDOW_SECONDS so the UI can show a message.
 * Safe to call on server (returns server value or DEFAULT_WINDOW_SECONDS).
 */
export function getRateLimitRetrySeconds(_key: string, serverRetryAfterSeconds?: number): number {
  if (
    serverRetryAfterSeconds !== undefined &&
    serverRetryAfterSeconds !== null &&
    Number.isFinite(serverRetryAfterSeconds) &&
    serverRetryAfterSeconds > 0
  ) {
    return Math.ceil(serverRetryAfterSeconds);
  }
  return DEFAULT_WINDOW_SECONDS;
}
