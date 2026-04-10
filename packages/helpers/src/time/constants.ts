/**
 * Shared time-duration constants for expiration, TTL, rate limits, and UI delays.
 * Use for semantic durations; keep ad-hoc setTimeout/retry delays as literals.
 */

/** Milliseconds per second. */
export const MS_PER_SECOND = 1000;

/** Seconds per minute. */
export const SECONDS_PER_MINUTE = 60;

/** Minutes per hour. */
export const MINUTES_PER_HOUR = 60;

/** Seconds per hour. */
export const SECONDS_PER_HOUR = SECONDS_PER_MINUTE * MINUTES_PER_HOUR;

/** Hours per day. */
export const HOURS_PER_DAY = 24;

/** One day in seconds (for cookie max-age, etc.). */
export const ONE_DAY_SECONDS = SECONDS_PER_HOUR * HOURS_PER_DAY;

/** One minute in ms (e.g. test tolerance). */
export const ONE_MINUTE_MS = SECONDS_PER_MINUTE * MS_PER_SECOND;

/** One hour in ms (e.g. invitation TTL: hours * ONE_HOUR_MS). */
export const ONE_HOUR_MS = MINUTES_PER_HOUR * ONE_MINUTE_MS;

/** 15 minutes in ms (rate limit window). */
export const FIFTEEN_MINUTES_MS = 15 * ONE_MINUTE_MS;

/** Cookie max age in days (sort prefs, etc.). */
export const COOKIE_MAX_AGE_DAYS = 365;

/** Delay before redirecting to login after logout (ms). */
export const LOGOUT_REDIRECT_TIMEOUT_MS = 5000;
