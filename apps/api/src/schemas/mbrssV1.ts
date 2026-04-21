import Joi from 'joi';

import {
  MBRSS_V1_ACTION_VALUES,
  MBRSS_V1_CURRENCY_BTC,
  MBRSS_V1_CURRENCY_VALUES,
  MBRSS_V1_SATOSHIS_UNIT,
  MEDIUM_TEXT_MAX_LENGTH,
  SHORT_TEXT_MAX_LENGTH,
  URL_MAX_LENGTH,
} from '@metaboost/helpers';

export const createMbrssV1BoostSchema = Joi.object({
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
    otherwise: Joi.string().trim().valid('cents').insensitive().lowercase().required(),
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
  feed_guid: Joi.string().trim().min(1).max(MEDIUM_TEXT_MAX_LENGTH).required(),
  podcast_index_feed_id: Joi.number().integer().positive().optional(),
  feed_title: Joi.string().trim().min(1).max(MEDIUM_TEXT_MAX_LENGTH).required(),
  item_guid: Joi.string().trim().min(1).max(URL_MAX_LENGTH).optional(),
  item_title: Joi.string().trim().min(1).max(MEDIUM_TEXT_MAX_LENGTH).optional(),
  time_position: Joi.number().min(0).optional(),
})
  .with('item_guid', 'item_title')
  .with('item_title', 'item_guid');

export type CreateMbrssV1BoostBody = {
  currency: string;
  amount: number;
  amount_unit: string;
  action: (typeof MBRSS_V1_ACTION_VALUES)[number];
  app_name: string;
  app_version?: string;
  sender_name?: string;
  sender_guid: string;
  message?: string | null;
  feed_guid: string;
  podcast_index_feed_id?: number;
  feed_title: string;
  item_guid?: string;
  item_title?: string;
  time_position?: number;
};
