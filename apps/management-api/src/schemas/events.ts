import Joi from 'joi';

import { DEFAULT_PAGE_LIMIT, MAX_PAGE_SIZE } from '@boilerplate/helpers';

export const listEventsQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_LIMIT),
  offset: Joi.number().integer().min(0).default(0),
});
