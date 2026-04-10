import type { RequestHandler } from 'express';

/**
 * Auth rate limit middleware for management-api. Only login is rate limited;
 * there are no open signup or password-reset flows in the management API.
 * Limits and key strategy are defined in @metaboost/helpers-backend-api.
 */
import { createStrictAuthRateLimiter } from '@metaboost/helpers-backend-api';

export const loginRateLimiter: RequestHandler = createStrictAuthRateLimiter();
