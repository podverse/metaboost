export type WebAuthMode = 'admin_only_username' | 'admin_only_email' | 'user_signup_email';

export type WebAuthModeCapabilities = {
  canPublicSignup: boolean;
  canUseEmailVerificationFlows: boolean;
  canIssueAdminInviteLink: boolean;
  requiresEmailAtInviteCompletion: boolean;
};

const AUTH_MODE_ADMIN_ONLY_USERNAME: WebAuthMode = 'admin_only_username';
const AUTH_MODE_ADMIN_ONLY_EMAIL: WebAuthMode = 'admin_only_email';
const AUTH_MODE_USER_SIGNUP_EMAIL: WebAuthMode = 'user_signup_email';

export const parseWebAuthMode = (value: string | undefined): WebAuthMode | undefined => {
  if (value === AUTH_MODE_ADMIN_ONLY_USERNAME) {
    return AUTH_MODE_ADMIN_ONLY_USERNAME;
  }
  if (value === AUTH_MODE_ADMIN_ONLY_EMAIL) {
    return AUTH_MODE_ADMIN_ONLY_EMAIL;
  }
  if (value === AUTH_MODE_USER_SIGNUP_EMAIL) {
    return AUTH_MODE_USER_SIGNUP_EMAIL;
  }
  return undefined;
};

export const getWebAuthModeCapabilities = (value: string | undefined): WebAuthModeCapabilities => {
  const parsed = parseWebAuthMode(value);
  if (parsed === AUTH_MODE_USER_SIGNUP_EMAIL) {
    return {
      canPublicSignup: true,
      canUseEmailVerificationFlows: true,
      canIssueAdminInviteLink: false,
      requiresEmailAtInviteCompletion: false,
    };
  }
  if (parsed === AUTH_MODE_ADMIN_ONLY_EMAIL) {
    return {
      canPublicSignup: false,
      canUseEmailVerificationFlows: true,
      canIssueAdminInviteLink: true,
      requiresEmailAtInviteCompletion: true,
    };
  }
  return {
    canPublicSignup: false,
    canUseEmailVerificationFlows: false,
    canIssueAdminInviteLink: true,
    requiresEmailAtInviteCompletion: false,
  };
};
