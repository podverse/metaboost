import Joi from 'joi';

import { SHORT_ID_INPUT_MIN_LENGTH, SHORT_TEXT_MAX_LENGTH, UUID_LENGTH } from '@metaboost/helpers';

const name = Joi.string().min(1).max(SHORT_TEXT_MAX_LENGTH);
const crudMask = Joi.number().integer().min(0).max(15);

export const createBucketSchema = Joi.object({
  name: name.required(),
  isPublic: Joi.boolean().optional(),
});

export const updateBucketSchema = Joi.object({
  name: name.optional(),
  isPublic: Joi.boolean().optional(),
  messageBodyMaxLength: Joi.number().integer().min(1).allow(null).optional(),
}).min(1);

export const createChildBucketSchema = Joi.object({
  name: name.required(),
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

export type CreateBucketBody = { name: string; isPublic?: boolean };
export type UpdateBucketBody = {
  name?: string;
  isPublic?: boolean;
  messageBodyMaxLength?: number | null;
};
export type CreateChildBucketBody = { name: string; isPublic?: boolean };
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
