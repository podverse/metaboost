import Joi from 'joi';

import { PASSWORD_MAX_LENGTH, SHORT_TEXT_MAX_LENGTH } from '@metaboost/helpers';

const password = Joi.string().min(1).max(PASSWORD_MAX_LENGTH).required();

/** Management auth is username-only (no email). */
export const loginSchema = Joi.object({
  username: Joi.string().min(1).max(SHORT_TEXT_MAX_LENGTH).trim().required(),
  password,
});

export const changePasswordSchema = Joi.object({
  currentPassword: password,
  newPassword: password,
});

export const updateProfileSchema = Joi.object({
  displayName: Joi.string().min(1).max(SHORT_TEXT_MAX_LENGTH).required(),
});
