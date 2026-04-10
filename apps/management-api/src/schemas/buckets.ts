import Joi from 'joi';

import { SHORT_TEXT_MAX_LENGTH } from '@metaboost/helpers';

const name = Joi.string().min(1).max(SHORT_TEXT_MAX_LENGTH);
const crudMask = Joi.number().integer().min(0).max(15);

export const createBucketSchema = Joi.object({
  name: name.required(),
  isPublic: Joi.boolean().optional(),
  /** Main-app user id (UUID) who will own the bucket. */
  ownerId: Joi.string().uuid().required(),
});

export const createChildBucketSchema = Joi.object({
  name: name.required(),
  isPublic: Joi.boolean().optional(),
});

export const updateBucketSchema = Joi.object({
  name: name.optional(),
  isPublic: Joi.boolean().optional(),
  messageBodyMaxLength: Joi.number().integer().min(1).allow(null).optional(),
}).min(1);

/** Create bucket admin invitation. Returns token for shareable link. */
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

export type CreateBucketBody = { name: string; isPublic?: boolean; ownerId: string };
export type CreateChildBucketBody = { name: string; isPublic?: boolean };
export type UpdateBucketBody = {
  name?: string;
  isPublic?: boolean;
  messageBodyMaxLength?: number | null;
};
