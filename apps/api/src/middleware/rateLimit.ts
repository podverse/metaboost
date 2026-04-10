import type { RequestHandler } from 'express';

/**
 * Auth rate limit middleware instances for apps/api. Strict applies to login, signup,
 * and password-reset flows; moderate applies to change-password. GET /me and POST /logout
 * are not rate limited. Limits and key strategy are defined in @boilerplate/helpers-backend-api.
 */
import {
  createModerateAuthRateLimiter,
  createStrictAuthRateLimiter,
} from '@boilerplate/helpers-backend-api';

export const strictAuthRateLimiter: RequestHandler = createStrictAuthRateLimiter();

export const moderateAuthRateLimiter: RequestHandler = createModerateAuthRateLimiter();
