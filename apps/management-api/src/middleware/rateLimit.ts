import type { RequestHandler } from 'express';

/**
 * Auth rate limit middleware for management-api. Only login is rate limited;
 * there are no open signup or password-reset flows in the management API.
 * Limits and key strategy are defined in @boilerplate/helpers-backend-api.
 */
import { createStrictAuthRateLimiter } from '@boilerplate/helpers-backend-api';

export const loginRateLimiter: RequestHandler = createStrictAuthRateLimiter();
