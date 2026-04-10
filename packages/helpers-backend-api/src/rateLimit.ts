import type { Options } from 'express-rate-limit';

import { ipKeyGenerator, rateLimit } from 'express-rate-limit';

/**
 * Shared rate-limit middleware factory for Express APIs. Keyed by IP by default.
 * Use createStrictRateLimiter / createModerateRateLimiter for auth endpoints, or
 * createRateLimiter for custom limits. Reusable by apps/api, apps/management-api, etc.
 *
 * The custom handler reads resetTime from express-rate-limit's in-memory store to compute
 * the exact seconds remaining in the current window (not the full windowMs). It embeds
 * retryAfterSeconds in the JSON body so the client always has the precise value.
 */
import { FIFTEEN_MINUTES_MS, MS_PER_SECOND } from '@boilerplate/helpers';

const DEFAULT_MESSAGE = 'Too many requests. Please try again later.';

/**
 * Extracts the resetTime Date set by express-rate-limit on the request object.
 * The property name is configurable (default: "rateLimit"), so we use narrowing
 * with prototype-safe property access to avoid index-signature type errors on Request.
 */
function extractResetTime(req: object, propertyName: string): Date | undefined {
  if (!Object.prototype.hasOwnProperty.call(req, propertyName)) return undefined;
  const info: unknown = (req as Record<string, unknown>)[propertyName];
  if (typeof info !== 'object' || info === null) return undefined;
  const resetTime: unknown = (info as Record<string, unknown>)['resetTime'];
  return resetTime instanceof Date ? resetTime : undefined;
}

/**
 * Custom 429 handler. Reads resetTime from the per-IP in-memory store entry to compute
 * the actual seconds remaining until the window resets (not the full window duration).
 * Embeds retryAfterSeconds in the JSON body — the response body is the single source of
 * truth so browser clients can read it regardless of CORS header-exposure rules.
 */
const rateLimitHandler: Options['handler'] = (req, res, _next, optionsUsed) => {
  const resetTime = extractResetTime(req, optionsUsed.requestPropertyName);
  let retryAfterSec: number | undefined;
  if (resetTime !== undefined) {
    const diff = Math.ceil((resetTime.getTime() - Date.now()) / MS_PER_SECOND);
    if (diff > 0) retryAfterSec = diff;
  }
  res.status(429).json({ message: DEFAULT_MESSAGE, retryAfterSeconds: retryAfterSec });
};

/** Options for the rate limiter (custom handler, standard headers). */
const DEFAULT_RESPONSE_OPTIONS: Pick<Options, 'statusCode' | 'standardHeaders' | 'handler'> = {
  statusCode: 429,
  standardHeaders: true,
  handler: rateLimitHandler,
};

export interface RateLimiterOptions {
  /** Max requests per window (express-rate-limit v7+ uses `limit`). */
  limit: number;
  /** Window duration in ms. */
  windowMs: number;
  /** Optional custom store (e.g. Redis/Valkey) for multi-instance. */
  store?: Options['store'];
  /** Optional key generator; default is IP only. Use (req) => req.ip + req.path for per-route. */
  keyGenerator?: Options['keyGenerator'];
}

/**
 * Create a rate limiter middleware. Keyed by IP (and optionally by path for per-route
 * limits). Returns 429 with a JSON message, RateLimit headers, and Retry-After (seconds
 * until the current window resets, from backend state).
 */
export function createRateLimiter(options: RateLimiterOptions): ReturnType<typeof rateLimit> {
  const { limit, windowMs, store, keyGenerator } = options;
  return rateLimit({
    windowMs,
    limit,
    store,
    ...(keyGenerator !== undefined && { keyGenerator }),
    ...DEFAULT_RESPONSE_OPTIONS,
  });
}

/** Default strict: 10 requests per 15 minutes per IP (login, signup, reset flows). */
const STRICT_DEFAULT_MAX = 10;
const STRICT_DEFAULT_WINDOW_MS = FIFTEEN_MINUTES_MS;

/**
 * Strict rate limiter for sensitive auth endpoints (login, signup, forgot-password,
 * reset-password, verify-email, request-email-change, confirm-email-change).
 * Default: 10 req / 15 min per IP. Pass options to override.
 */
export function createStrictRateLimiter(
  overrides: Partial<RateLimiterOptions> = {}
): ReturnType<typeof rateLimit> {
  return createRateLimiter({
    limit: STRICT_DEFAULT_MAX,
    windowMs: STRICT_DEFAULT_WINDOW_MS,
    ...overrides,
  });
}

/** Default moderate: 30 requests per 15 minutes per IP (e.g. change-password). */
const MODERATE_DEFAULT_MAX = 30;
const MODERATE_DEFAULT_WINDOW_MS = FIFTEEN_MINUTES_MS;

/**
 * Moderate rate limiter for less sensitive auth endpoints (e.g. change-password).
 * Default: 30 req / 15 min per IP. Pass options to override.
 */
export function createModerateRateLimiter(
  overrides: Partial<RateLimiterOptions> = {}
): ReturnType<typeof rateLimit> {
  return createRateLimiter({
    limit: MODERATE_DEFAULT_MAX,
    windowMs: MODERATE_DEFAULT_WINDOW_MS,
    ...overrides,
  });
}

/**
 * Key generator that combines the client IP (with v8 IPv6 subnet masking) with the
 * full request path so each endpoint has its own rate-limit bucket (e.g. login and
 * signup count separately). Uses ipKeyGenerator so custom keyGenerators satisfy v8
 * keyGeneratorIpFallback validation and IPv6 addresses are normalized.
 */
export function ipAndPathKeyGenerator(req: {
  ip?: string;
  baseUrl?: string;
  path?: string;
}): string {
  const ip = ipKeyGenerator(req.ip ?? '');
  const path = [req.baseUrl, req.path].filter(Boolean).join('');
  return `${ip}:${path}`;
}

/**
 * In test: rate limiting is effectively disabled by using a very high limit (100k)
 * so integration tests never hit 429. We do not add dedicated rate-limit tests.
 */
const isTest = process.env.NODE_ENV === 'test';
const TEST_LIMIT_HIGH = 100_000;

/**
 * Pre-configured strict auth rate limiter: 10 req / 15 min per IP+path in production;
 * in test, a very high limit so tests never hit 429.
 */
export function createStrictAuthRateLimiter(
  overrides: Partial<RateLimiterOptions> = {}
): ReturnType<typeof rateLimit> {
  return createStrictRateLimiter({
    limit: isTest ? TEST_LIMIT_HIGH : STRICT_DEFAULT_MAX,
    windowMs: STRICT_DEFAULT_WINDOW_MS,
    keyGenerator: ipAndPathKeyGenerator,
    ...overrides,
  });
}

/**
 * Pre-configured moderate auth rate limiter: 30 req / 15 min per IP+path in production;
 * in test, a very high limit so tests never hit 429.
 */
export function createModerateAuthRateLimiter(
  overrides: Partial<RateLimiterOptions> = {}
): ReturnType<typeof rateLimit> {
  return createModerateRateLimiter({
    limit: isTest ? TEST_LIMIT_HIGH : MODERATE_DEFAULT_MAX,
    windowMs: MODERATE_DEFAULT_WINDOW_MS,
    keyGenerator: ipAndPathKeyGenerator,
    ...overrides,
  });
}
