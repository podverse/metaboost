import Joi from 'joi';

import {
  EMAIL_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  SHORT_TEXT_MAX_LENGTH,
  USERNAME_MAX_LENGTH,
} from '@metaboost/helpers';

export type {
  ChangeUserPasswordBody,
  CreateUserBody,
  UpdateUserBody,
} from '@metaboost/helpers-requests';

const displayNameField = Joi.string().max(SHORT_TEXT_MAX_LENGTH).allow(null, '');

const emailField = Joi.string().email().max(EMAIL_MAX_LENGTH).allow('', null);
/** Username must not contain @ (to avoid confusion with email). */
const USERNAME_PATTERN = /^[a-zA-Z0-9_-]+$/;
const usernameField = Joi.string()
  .min(1)
  .max(USERNAME_MAX_LENGTH)
  .pattern(USERNAME_PATTERN)
  .trim()
  .allow('', null);

/**
 * At least one of email or username required.
 * password is optional in schema; controller enforces mode-specific invitation behavior.
 */
export const createUserSchema = Joi.object({
  email: emailField,
  username: usernameField,
  password: Joi.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH).optional(),
  displayName: displayNameField,
  initialBucketAdminIds: Joi.array().items(Joi.string().uuid()).optional(),
})
  .custom((value) => {
    const e =
      value.email !== undefined && value.email !== null && String(value.email).trim() !== ''
        ? String(value.email).trim()
        : null;
    const u =
      value.username !== undefined &&
      value.username !== null &&
      String(value.username).trim() !== ''
        ? String(value.username).trim()
        : null;
    if (e === null && u === null) {
      throw new Error('At least one of email or username required');
    }
    return { ...value, email: e ?? undefined, username: u ?? undefined };
  })
  .required();

export const updateUserSchema = Joi.object({
  email: Joi.string().email().max(EMAIL_MAX_LENGTH),
  displayName: Joi.string().max(SHORT_TEXT_MAX_LENGTH).allow(null, ''),
}).min(1);

export const changeUserPasswordSchema = Joi.object({
  newPassword: Joi.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH).required(),
});
