import Joi from 'joi';

import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  SHORT_TEXT_MAX_LENGTH,
} from '@boilerplate/helpers';

export type {
  ChangePasswordBody,
  CreateAdminBody,
  UpdateAdminBody,
} from '@boilerplate/helpers-requests';

const crudSchema = Joi.number().integer().min(0).max(15);
const eventVisibilitySchema = Joi.string().valid('own', 'all_admins', 'all');
const roleIdSchema = Joi.string().max(50);

export const createAdminSchema = Joi.object({
  username: Joi.string().min(1).max(SHORT_TEXT_MAX_LENGTH).trim().required(),
  password: Joi.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH).required(),
  displayName: Joi.string().max(SHORT_TEXT_MAX_LENGTH).min(1).required(),
  roleId: roleIdSchema,
  adminsCrud: crudSchema.default(0),
  usersCrud: crudSchema.default(0),
  bucketsCrud: crudSchema.default(0),
  bucketMessagesCrud: crudSchema.default(0),
  bucketAdminsCrud: crudSchema.default(0),
  eventVisibility: eventVisibilitySchema.default('all_admins'),
});

export const updateAdminSchema = Joi.object({
  username: Joi.string().min(1).max(SHORT_TEXT_MAX_LENGTH).trim(),
  displayName: Joi.string().max(SHORT_TEXT_MAX_LENGTH).min(1),
  password: Joi.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
  roleId: roleIdSchema,
  adminsCrud: crudSchema,
  usersCrud: crudSchema,
  bucketsCrud: crudSchema,
  bucketMessagesCrud: crudSchema,
  bucketAdminsCrud: crudSchema,
  eventVisibility: eventVisibilitySchema,
}).min(1);

export const createManagementAdminRoleSchema = Joi.object({
  name: Joi.string().max(SHORT_TEXT_MAX_LENGTH).min(1).required(),
  adminsCrud: crudSchema.required(),
  usersCrud: crudSchema.required(),
  bucketsCrud: crudSchema.required(),
  bucketMessagesCrud: crudSchema.required(),
  bucketAdminsCrud: crudSchema.required(),
  eventVisibility: eventVisibilitySchema.required(),
});

export const updateManagementAdminRoleSchema = Joi.object({
  name: Joi.string().max(SHORT_TEXT_MAX_LENGTH).min(1),
  adminsCrud: crudSchema,
  usersCrud: crudSchema,
  bucketsCrud: crudSchema,
  bucketMessagesCrud: crudSchema,
  bucketAdminsCrud: crudSchema,
  eventVisibility: eventVisibilitySchema,
}).min(1);

export type CreateManagementAdminRoleBody = {
  name: string;
  adminsCrud: number;
  usersCrud: number;
  bucketsCrud: number;
  bucketMessagesCrud: number;
  bucketAdminsCrud: number;
  eventVisibility: 'own' | 'all_admins' | 'all';
};

export type UpdateManagementAdminRoleBody = {
  name?: string;
  adminsCrud?: number;
  usersCrud?: number;
  bucketsCrud?: number;
  bucketMessagesCrud?: number;
  bucketAdminsCrud?: number;
  eventVisibility?: 'own' | 'all_admins' | 'all';
};

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH).required(),
});

export const changeUserPasswordSchema = Joi.object({
  newPassword: Joi.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH).required(),
});
