import Joi from 'joi';

import {
  MB1_ACTION_VALUES,
  MEDIUM_TEXT_MAX_LENGTH,
  SHORT_TEXT_MAX_LENGTH,
  URL_MAX_LENGTH,
} from '@metaboost/helpers';

export const createMb1BoostSchema = Joi.object({
  currency: Joi.string().trim().min(1).max(SHORT_TEXT_MAX_LENGTH).required(),
  amount: Joi.number().positive().required(),
  amount_unit: Joi.string().trim().min(1).max(SHORT_TEXT_MAX_LENGTH).optional(),
  action: Joi.string()
    .valid(...MB1_ACTION_VALUES)
    .required(),
  app_name: Joi.string().trim().min(1).max(SHORT_TEXT_MAX_LENGTH).required(),
  app_version: Joi.string().trim().min(1).max(SHORT_TEXT_MAX_LENGTH).optional(),
  sender_name: Joi.string().trim().min(1).max(SHORT_TEXT_MAX_LENGTH).optional(),
  sender_id: Joi.string().trim().min(1).max(MEDIUM_TEXT_MAX_LENGTH).optional(),
  message: Joi.string().max(10000).optional(),
  feed_guid: Joi.string().trim().min(1).max(MEDIUM_TEXT_MAX_LENGTH).required(),
  podcast_index_feed_id: Joi.number().integer().positive().optional(),
  feed_title: Joi.string().trim().min(1).max(MEDIUM_TEXT_MAX_LENGTH).required(),
  item_guid: Joi.string().trim().min(1).max(URL_MAX_LENGTH).optional(),
  item_title: Joi.string().trim().min(1).max(MEDIUM_TEXT_MAX_LENGTH).optional(),
  time_position: Joi.number().min(0).optional(),
})
  .with('item_guid', 'item_title')
  .with('item_title', 'item_guid');

export const confirmMb1PaymentSchema = Joi.object({
  message_guid: Joi.string()
    .guid({ version: ['uuidv4', 'uuidv5', 'uuidv1'] })
    .required(),
  payment_verified_by_app: Joi.boolean().required(),
});

export type CreateMb1BoostBody = {
  currency: string;
  amount: number;
  amount_unit?: string;
  action: (typeof MB1_ACTION_VALUES)[number];
  app_name: string;
  app_version?: string;
  sender_name?: string;
  sender_id?: string;
  message?: string;
  feed_guid: string;
  podcast_index_feed_id?: number;
  feed_title: string;
  item_guid?: string;
  item_title?: string;
  time_position?: number;
};

export type ConfirmMb1PaymentBody = {
  message_guid: string;
  payment_verified_by_app: boolean;
};
