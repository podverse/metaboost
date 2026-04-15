import Joi from 'joi';

import {
  SHORT_ID_INPUT_MIN_LENGTH,
  SHORT_TEXT_MAX_LENGTH,
  URL_MAX_LENGTH,
  UUID_LENGTH,
} from '@metaboost/helpers';

const MIN_MESSAGE_BODY_MAX_LENGTH = 140;
const MAX_MESSAGE_BODY_MAX_LENGTH = 2500;

const name = Joi.string().min(1).max(SHORT_TEXT_MAX_LENGTH);
const rssFeedUrl = Joi.string()
  .uri({ scheme: ['http', 'https'] })
  .max(URL_MAX_LENGTH);
const bucketCreateTopLevelType = Joi.string().valid('rss-network', 'rss-channel');
const bucketCreateChildType = Joi.string().valid('rss-channel');
const crudMask = Joi.number().integer().min(0).max(15);

export const createBucketSchema = Joi.object({
  type: bucketCreateTopLevelType.required(),
  name: Joi.when('type', {
    is: 'rss-network',
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
  applyToDescendants: Joi.boolean().optional(),
}).min(1);

export const createChildBucketSchema = Joi.object({
  type: bucketCreateChildType.required(),
  rssFeedUrl: rssFeedUrl.required(),
  name: Joi.forbidden(),
  isPublic: Joi.boolean().optional(),
});

/** User id: shortId (10–12 chars) or UUID. */
export const createBucketAdminSchema = Joi.object({
  userId: Joi.string().min(SHORT_ID_INPUT_MIN_LENGTH).max(UUID_LENGTH).required(),
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

export type CreateBucketBody =
  | { type: 'rss-network'; name: string; isPublic?: boolean }
  | { type: 'rss-channel'; rssFeedUrl: string; isPublic?: boolean };
export type UpdateBucketBody = {
  name?: string;
  isPublic?: boolean;
  messageBodyMaxLength?: number;
  applyToDescendants?: boolean;
};
export type CreateChildBucketBody = {
  type: 'rss-channel';
  rssFeedUrl: string;
  isPublic?: boolean;
};
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
