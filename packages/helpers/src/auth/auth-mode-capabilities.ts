import type { AuthModeValue } from './auth-mode-constants.js';

import {
  AUTH_MODE_ADMIN_ONLY_EMAIL,
  AUTH_MODE_ADMIN_ONLY_USERNAME,
  AUTH_MODE_USER_SIGNUP_EMAIL,
} from './auth-mode-constants.js';

export type AuthModeCapabilities = {
  canPublicSignup: boolean;
  canUseEmailVerificationFlows: boolean;
  canIssueAdminInviteLink: boolean;
  requiresEmailAtInviteCompletion: boolean;
};

export function parseAuthModeOrThrow(value: string): AuthModeValue {
  if (value === AUTH_MODE_ADMIN_ONLY_USERNAME) {
    return AUTH_MODE_ADMIN_ONLY_USERNAME;
  }
  if (value === AUTH_MODE_ADMIN_ONLY_EMAIL) {
    return AUTH_MODE_ADMIN_ONLY_EMAIL;
  }
  if (value === AUTH_MODE_USER_SIGNUP_EMAIL) {
    return AUTH_MODE_USER_SIGNUP_EMAIL;
  }
  throw new Error(
    `Invalid AUTH_MODE: ${value}. Expected one of: ${AUTH_MODE_ADMIN_ONLY_USERNAME}, ${AUTH_MODE_ADMIN_ONLY_EMAIL}, ${AUTH_MODE_USER_SIGNUP_EMAIL}`
  );
}

export function getAuthModeCapabilities(authMode: AuthModeValue): AuthModeCapabilities {
  if (authMode === AUTH_MODE_ADMIN_ONLY_USERNAME) {
    return {
      canPublicSignup: false,
      canUseEmailVerificationFlows: false,
      canIssueAdminInviteLink: true,
      requiresEmailAtInviteCompletion: false,
    };
  }
  if (authMode === AUTH_MODE_ADMIN_ONLY_EMAIL) {
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
