import type { AuthModeCapabilities } from '../config/index.js';

import Joi from 'joi';

import {
  EMAIL_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  SHORT_TEXT_MAX_LENGTH,
  USERNAME_MAX_LENGTH,
} from '@metaboost/helpers';

export type {
  ChangePasswordBody,
  ConfirmEmailChangeBody,
  ForgotPasswordBody,
  LoginBody,
  RequestEmailChangeBody,
  ResetPasswordBody,
  SetPasswordBody,
  SignupBody,
  UpdateProfileBody,
  VerifyEmailBody,
} from '@metaboost/helpers-requests';

const email = Joi.string().email().max(EMAIL_MAX_LENGTH).required();
const password = Joi.string().min(1).max(PASSWORD_MAX_LENGTH).required();

/** Login identifier (email or username); no format check so both work. */
const loginIdentifier = Joi.string().min(1).max(EMAIL_MAX_LENGTH).trim().required();

export const loginSchema = Joi.object({
  email: loginIdentifier,
  password,
});

const username = Joi.string().min(1).max(USERNAME_MAX_LENGTH).trim().required();

export const signupSchema = Joi.object({
  email,
  username,
  password,
  displayName: Joi.string().max(SHORT_TEXT_MAX_LENGTH).allow(null, ''),
});

export const changePasswordSchema = Joi.object({
  currentPassword: password,
  newPassword: password,
});

export const verifyEmailSchema = Joi.object({
  token: Joi.string().min(1).required(),
}).options({ allowUnknown: true });

export const forgotPasswordSchema = Joi.object({
  email,
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().min(1).required(),
  newPassword: password,
});

const optionalEmail = Joi.string().email().max(EMAIL_MAX_LENGTH).trim();
const optionalUsername = Joi.string().min(1).max(USERNAME_MAX_LENGTH).trim();

export const createSetPasswordSchema = (authModeCapabilities: AuthModeCapabilities) => {
  const base = {
    token: Joi.string().min(1).required(),
    newPassword: password,
  };
  if (!authModeCapabilities.canIssueAdminInviteLink) {
    return Joi.object({
      ...base,
      email: optionalEmail,
      username: optionalUsername,
    });
  }
  if (authModeCapabilities.requiresEmailAtInviteCompletion) {
    return Joi.object({
      ...base,
      email,
      username,
    });
  }
  return Joi.object({
    ...base,
    username,
    email: optionalEmail,
  });
};

export const requestEmailChangeSchema = Joi.object({
  newEmail: email,
});

export const confirmEmailChangeSchema = Joi.object({
  token: Joi.string().min(1).required(),
}).options({ allowUnknown: true });

export const updateProfileSchema = Joi.object({
  displayName: Joi.string().max(SHORT_TEXT_MAX_LENGTH).allow(null, ''),
  username: Joi.string().min(0).max(USERNAME_MAX_LENGTH).trim().allow(null, ''),
});
