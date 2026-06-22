import type {
  UpsertWebPushSubscriptionBody,
  UpdateWebPushSubscriptionBody,
} from '@metaboost/helpers-requests';

import Joi from 'joi';

import { SHORT_TEXT_MAX_LENGTH, URL_MAX_LENGTH } from '@metaboost/helpers';

const webPushKey = Joi.string().min(1);

const webPushKeysObject = Joi.object({
  p256dh: webPushKey.required(),
  auth: webPushKey.required(),
});

export const upsertWebPushSubscriptionSchema = Joi.object({
  endpoint: Joi.string().uri().max(URL_MAX_LENGTH).required(),
  keys: webPushKeysObject.required(),
  locale: Joi.string().max(SHORT_TEXT_MAX_LENGTH).allow(null, '').optional(),
});

export const updateWebPushSubscriptionSchema = Joi.object({
  endpoint: Joi.string().uri().max(URL_MAX_LENGTH).optional(),
  keys: webPushKeysObject.optional(),
  locale: Joi.string().max(SHORT_TEXT_MAX_LENGTH).allow(null, '').optional(),
}).min(1);

export type { UpsertWebPushSubscriptionBody, UpdateWebPushSubscriptionBody };
