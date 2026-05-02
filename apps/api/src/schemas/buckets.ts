import Joi from 'joi';

import {
  NANO_ID_V2_MIN_LENGTH,
  SHORT_TEXT_MAX_LENGTH,
  URL_MAX_LENGTH,
  UUID_LENGTH,
} from '@metaboost/helpers';
import { SUPPORTED_CURRENCIES_ORDERED } from '@metaboost/helpers-currency';

const MIN_MESSAGE_BODY_MAX_LENGTH = 140;
const MAX_MESSAGE_BODY_MAX_LENGTH = 2500;
const MIN_PUBLIC_BOOST_DISPLAY_MINIMUM_MINOR = 0;
const MAX_PUBLIC_BOOST_DISPLAY_MINIMUM_MINOR = 2147483647;

const name = Joi.string().min(1).max(SHORT_TEXT_MAX_LENGTH);
const rssFeedUrl = Joi.string()
  .uri({ scheme: ['http', 'https'] })
  .max(URL_MAX_LENGTH);
const bucketCreateTopLevelType = Joi.string().valid('rss-network', 'rss-channel', 'mb-root');
const bucketCreateChildType = Joi.string().valid('rss-channel', 'mb-mid', 'mb-leaf');
const crudMask = Joi.number().integer().min(0).max(15);

export const createBucketSchema = Joi.object({
  type: bucketCreateTopLevelType.required(),
  name: Joi.when('type', {
    is: Joi.valid('rss-network', 'mb-root'),
    then: name.required(),
    otherwise: Joi.forbidden(),
  }),
  rssFeedUrl: Joi.when('type', {
    is: 'rss-channel',
    then: rssFeedUrl.required(),
    otherwise: Joi.forbidden(),
  }),
  isPublic: Joi.boolean().optional(),
});

export const updateBucketSchema = Joi.object({
  name: name.optional(),
  isPublic: Joi.boolean().optional(),
  messageBodyMaxLength: Joi.number()
    .integer()
    .min(MIN_MESSAGE_BODY_MAX_LENGTH)
    .max(MAX_MESSAGE_BODY_MAX_LENGTH)
    .optional(),
  preferredCurrency: Joi.string()
    .trim()
    .uppercase()
    .valid(...SUPPORTED_CURRENCIES_ORDERED)
    .optional(),
  publicBoostDisplayMinimumMinor: Joi.number()
    .integer()
    .min(MIN_PUBLIC_BOOST_DISPLAY_MINIMUM_MINOR)
    .max(MAX_PUBLIC_BOOST_DISPLAY_MINIMUM_MINOR)
    .optional(),
  applyToDescendants: Joi.boolean().optional(),
}).min(1);

export const createChildBucketSchema = Joi.object({
  type: bucketCreateChildType.required(),
  rssFeedUrl: Joi.when('type', {
    is: 'rss-channel',
    then: rssFeedUrl.required(),
    otherwise: Joi.forbidden(),
  }),
  name: Joi.when('type', {
    is: Joi.valid('mb-mid', 'mb-leaf'),
    then: name.required(),
    otherwise: Joi.forbidden(),
  }),
  isPublic: Joi.boolean().optional(),
});

/** User id: idText (nano_id_v2, 9–15 chars) or UUID. */
export const createBucketAdminSchema = Joi.object({
  userId: Joi.string().min(NANO_ID_V2_MIN_LENGTH).max(UUID_LENGTH).required(),
  bucketCrud: crudMask.optional(),
  bucketMessagesCrud: crudMask.optional(),
  bucketAdminsCrud: crudMask.optional(),
});

/** Create admin invitation (no userId); returns token for shareable link. */
export const createBucketAdminInvitationSchema = Joi.object({
  bucketCrud: crudMask.optional(),
  bucketMessagesCrud: crudMask.optional(),
  bucketAdminsCrud: crudMask.optional(),
});

export const updateBucketAdminSchema = Joi.object({
  bucketCrud: crudMask.optional(),
  bucketMessagesCrud: crudMask.optional(),
  bucketAdminsCrud: crudMask.optional(),
}).min(1);

const roleName = Joi.string().min(1).max(SHORT_TEXT_MAX_LENGTH);
export const createBucketRoleSchema = Joi.object({
  name: roleName.required(),
  bucketCrud: crudMask.required(),
  bucketMessagesCrud: crudMask.required(),
  bucketAdminsCrud: crudMask.required(),
});
export const updateBucketRoleSchema = Joi.object({
  name: roleName.optional(),
  bucketCrud: crudMask.optional(),
  bucketMessagesCrud: crudMask.optional(),
  bucketAdminsCrud: crudMask.optional(),
}).min(1);

export const addBlockedSenderSchema = Joi.object({
  senderGuid: Joi.string().uuid().required(),
  labelSnapshot: Joi.string().max(SHORT_TEXT_MAX_LENGTH).allow(null, '').optional(),
});

export const addBlockedAppSchema = Joi.object({
  appId: Joi.string().min(1).max(SHORT_TEXT_MAX_LENGTH).required(),
  appNameSnapshot: Joi.string().max(SHORT_TEXT_MAX_LENGTH).allow(null, '').optional(),
});

export type CreateBucketBody =
  | { type: 'rss-network'; name: string; isPublic?: boolean }
  | { type: 'rss-channel'; rssFeedUrl: string; isPublic?: boolean }
  | { type: 'mb-root'; name: string; isPublic?: boolean };
export type UpdateBucketBody = {
  name?: string;
  isPublic?: boolean;
  messageBodyMaxLength?: number;
  preferredCurrency?: string;
  publicBoostDisplayMinimumMinor?: number;
  applyToDescendants?: boolean;
};
export type CreateChildBucketBody =
  | { type: 'rss-channel'; rssFeedUrl: string; isPublic?: boolean }
  | { type: 'mb-mid'; name: string; isPublic?: boolean }
  | { type: 'mb-leaf'; name: string; isPublic?: boolean };
export type CreateBucketAdminBody = {
  userId: string;
  bucketCrud?: number;
  bucketMessagesCrud?: number;
  bucketAdminsCrud?: number;
};
export type CreateBucketAdminInvitationBody = {
  bucketCrud?: number;
  bucketMessagesCrud?: number;
  bucketAdminsCrud?: number;
};
export type UpdateBucketAdminBody = {
  bucketCrud?: number;
  bucketMessagesCrud?: number;
  bucketAdminsCrud?: number;
};
export type CreateBucketRoleBody = {
  name: string;
  bucketCrud: number;
  bucketMessagesCrud: number;
  bucketAdminsCrud: number;
};
export type UpdateBucketRoleBody = {
  name?: string;
  bucketCrud?: number;
  bucketMessagesCrud?: number;
  bucketAdminsCrud?: number;
};
