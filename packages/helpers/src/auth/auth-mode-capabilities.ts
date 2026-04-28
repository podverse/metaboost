import type { AccountSignupModeValue } from './auth-mode-constants.js';

import {
  ACCOUNT_SIGNUP_MODE_ADMIN_ONLY_EMAIL,
  ACCOUNT_SIGNUP_MODE_ADMIN_ONLY_USERNAME,
  ACCOUNT_SIGNUP_MODE_USER_SIGNUP_EMAIL,
} from './auth-mode-constants.js';

export type AccountSignupModeCapabilities = {
  canPublicSignup: boolean;
  canUseEmailVerificationFlows: boolean;
  canIssueAdminInviteLink: boolean;
  requiresEmailAtInviteCompletion: boolean;
};

export function parseAccountSignupModeOrThrow(value: string): AccountSignupModeValue {
  if (value === ACCOUNT_SIGNUP_MODE_ADMIN_ONLY_USERNAME) {
    return ACCOUNT_SIGNUP_MODE_ADMIN_ONLY_USERNAME;
  }
  if (value === ACCOUNT_SIGNUP_MODE_ADMIN_ONLY_EMAIL) {
    return ACCOUNT_SIGNUP_MODE_ADMIN_ONLY_EMAIL;
  }
  if (value === ACCOUNT_SIGNUP_MODE_USER_SIGNUP_EMAIL) {
    return ACCOUNT_SIGNUP_MODE_USER_SIGNUP_EMAIL;
  }
  throw new Error(
    `Invalid ACCOUNT_SIGNUP_MODE: ${value}. Expected one of: ${ACCOUNT_SIGNUP_MODE_ADMIN_ONLY_USERNAME}, ${ACCOUNT_SIGNUP_MODE_ADMIN_ONLY_EMAIL}, ${ACCOUNT_SIGNUP_MODE_USER_SIGNUP_EMAIL}`
  );
}

export function getAccountSignupModeCapabilities(
  authMode: AccountSignupModeValue
): AccountSignupModeCapabilities {
  if (authMode === ACCOUNT_SIGNUP_MODE_ADMIN_ONLY_USERNAME) {
    return {
      canPublicSignup: false,
      canUseEmailVerificationFlows: false,
      canIssueAdminInviteLink: true,
      requiresEmailAtInviteCompletion: false,
    };
  }
  if (authMode === ACCOUNT_SIGNUP_MODE_ADMIN_ONLY_EMAIL) {
    return {
      canPublicSignup: false,
      canUseEmailVerificationFlows: true,
      canIssueAdminInviteLink: true,
      requiresEmailAtInviteCompletion: true,
    };
  }
  return {
    canPublicSignup: true,
    canUseEmailVerificationFlows: true,
    canIssueAdminInviteLink: false,
    requiresEmailAtInviteCompletion: false,
  };
}
