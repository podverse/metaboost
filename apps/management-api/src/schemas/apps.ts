import Joi from 'joi';

import { SHORT_TEXT_MAX_LENGTH } from '@metaboost/helpers';

export const addGlobalBlockedAppSchema = Joi.object({
  appId: Joi.string().min(1).max(SHORT_TEXT_MAX_LENGTH).required(),
  note: Joi.string().max(SHORT_TEXT_MAX_LENGTH).allow(null, '').optional(),
});
