import type { AccountSignupModeCapabilities } from '../config/index.js';

import Joi from 'joi';

import {
  EMAIL_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  SHORT_TEXT_MAX_LENGTH,
  USERNAME_MAX_LENGTH,
} from '@metaboost/helpers';
import { SUPPORTED_CURRENCIES_ORDERED } from '@metaboost/helpers-currency';

export type {
  AcceptLatestTermsBody,
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

/** Username must not contain @ (to avoid confusion with email). */
const USERNAME_PATTERN = /^[a-zA-Z0-9_-]+$/;
const username = Joi.string()
  .min(1)
  .max(USERNAME_MAX_LENGTH)
  .pattern(USERNAME_PATTERN)
  .trim()
  .required();

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
const optionalUsername = Joi.string()
  .min(1)
  .max(USERNAME_MAX_LENGTH)
  .pattern(USERNAME_PATTERN)
  .trim();

export const createSetPasswordSchema = (
  accountSignupModeCapabilities: AccountSignupModeCapabilities
) => {
  const base = {
    token: Joi.string().min(1).required(),
    newPassword: password,
  };
  if (!accountSignupModeCapabilities.canIssueAdminInviteLink) {
    return Joi.object({
      ...base,
      email: optionalEmail,
      username: optionalUsername,
    });
  }
  if (accountSignupModeCapabilities.requiresEmailAtInviteCompletion) {
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
  username: Joi.string()
    .min(0)
    .max(USERNAME_MAX_LENGTH)
    .pattern(USERNAME_PATTERN)
    .trim()
    .allow(null, ''),
  preferredCurrency: Joi.string()
    .trim()
    .uppercase()
    .valid(...SUPPORTED_CURRENCIES_ORDERED)
    .allow(null, ''),
});

export const acceptLatestTermsSchema = Joi.object({
  agreeToTerms: Joi.boolean().valid(true).required(),
});
