import Joi from 'joi';

import {
  MBRSS_V1_ACTION_VALUES,
  MBRSS_V1_CURRENCY_BTC,
  MBRSS_V1_CURRENCY_VALUES,
  MBRSS_V1_SATOSHIS_UNIT,
  SHORT_TEXT_MAX_LENGTH,
} from '@metaboost/helpers';

export const createMbV1BoostSchema = Joi.object({
  currency: Joi.string()
    .trim()
    .valid(...MBRSS_V1_CURRENCY_VALUES)
    .insensitive()
    .uppercase()
    .required(),
  amount: Joi.number().integer().positive().required(),
  amount_unit: Joi.alternatives().conditional('currency', {
    is: MBRSS_V1_CURRENCY_BTC,
    then: Joi.string().trim().valid(MBRSS_V1_SATOSHIS_UNIT).insensitive().lowercase().required(),
    otherwise: Joi.string().trim().valid('cent').insensitive().lowercase().required(),
  }),
  action: Joi.string()
    .valid(...MBRSS_V1_ACTION_VALUES)
    .required(),
  app_name: Joi.string().trim().min(1).max(SHORT_TEXT_MAX_LENGTH).required(),
  app_version: Joi.string().trim().min(1).max(SHORT_TEXT_MAX_LENGTH).optional(),
  sender_name: Joi.string().trim().min(1).max(SHORT_TEXT_MAX_LENGTH).optional(),
  sender_guid: Joi.string().uuid().required(),
  message: Joi.alternatives().conditional('action', {
    is: 'stream',
    then: Joi.valid(null).optional(),
    otherwise: Joi.string().trim().min(1).max(10000).allow(null).optional(),
  }),
  time_position: Joi.number().min(0).optional(),
});

export type CreateMbV1BoostBody = {
  currency: string;
  amount: number;
  amount_unit: string;
  action: (typeof MBRSS_V1_ACTION_VALUES)[number];
  app_name: string;
  app_version?: string;
  sender_name?: string;
  sender_guid: string;
  message?: string | null;
  time_position?: number;
};
