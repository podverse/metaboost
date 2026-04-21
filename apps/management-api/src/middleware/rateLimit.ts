import type { RequestHandler } from 'express';
import type { Store } from 'express-rate-limit';

import { RedisStore } from 'rate-limit-redis';

/**
 * Auth rate limit middleware for management-api. Strict applies to login; moderate applies to
 * POST /refresh, POST /logout, and POST /change-password.
 * Limits and key strategy are defined in @metaboost/helpers-backend-api.
 *
 * When **`MANAGEMENT_API_AUTH_RATE_LIMIT_USE_VALKEY`** is **`true`**, counters use Valkey (`VALKEY_*`)
 * via `rate-limit-redis` so multi-instance deployments share limits.
 */
import { parseEnvBooleanToken } from '@metaboost/helpers';
import {
  createModerateAuthRateLimiter,
  createStrictAuthRateLimiter,
} from '@metaboost/helpers-backend-api';
import { createValkeyRedisClient } from '@metaboost/helpers-valkey';

function resolveValkeyRateLimitStore(): Store | undefined {
  const raw = process.env.MANAGEMENT_API_AUTH_RATE_LIMIT_USE_VALKEY?.trim();
  if (raw === undefined || raw === '') {
    return undefined;
  }
  if (parseEnvBooleanToken(raw) !== true) {
    return undefined;
  }
  const redis = createValkeyRedisClient();
  return new RedisStore({
    prefix: 'rl:management-api:auth:',
    sendCommand: (...args: string[]) => {
      const [cmd, ...rest] = args;
      if (typeof cmd !== 'string' || cmd === '') {
        return Promise.reject(new Error('rate-limit-redis sendCommand: missing Redis command'));
      }
      return redis.call(cmd, ...rest) as Promise<boolean | number | string>;
    },
  });
}

const sharedAuthRateLimitStore = resolveValkeyRateLimitStore();

export const loginRateLimiter: RequestHandler = createStrictAuthRateLimiter(
  sharedAuthRateLimitStore !== undefined ? { store: sharedAuthRateLimitStore } : {}
);

export const moderateAuthRateLimiter: RequestHandler = createModerateAuthRateLimiter(
  sharedAuthRateLimitStore !== undefined ? { store: sharedAuthRateLimitStore } : {}
);
