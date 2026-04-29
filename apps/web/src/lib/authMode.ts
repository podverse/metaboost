export type WebAccountSignupMode = 'admin_only_username' | 'admin_only_email' | 'user_signup_email';

export type WebAccountSignupModeCapabilities = {
  canPublicSignup: boolean;
  canUseEmailVerificationFlows: boolean;
  canIssueAdminInviteLink: boolean;
  requiresEmailAtInviteCompletion: boolean;
};

const ACCOUNT_SIGNUP_MODE_ADMIN_ONLY_USERNAME: WebAccountSignupMode = 'admin_only_username';
const ACCOUNT_SIGNUP_MODE_ADMIN_ONLY_EMAIL: WebAccountSignupMode = 'admin_only_email';
const ACCOUNT_SIGNUP_MODE_USER_SIGNUP_EMAIL: WebAccountSignupMode = 'user_signup_email';

export const parseWebAccountSignupMode = (
  value: string | undefined
): WebAccountSignupMode | undefined => {
  if (value === ACCOUNT_SIGNUP_MODE_ADMIN_ONLY_USERNAME) {
    return ACCOUNT_SIGNUP_MODE_ADMIN_ONLY_USERNAME;
  }
  if (value === ACCOUNT_SIGNUP_MODE_ADMIN_ONLY_EMAIL) {
    return ACCOUNT_SIGNUP_MODE_ADMIN_ONLY_EMAIL;
  }
  if (value === ACCOUNT_SIGNUP_MODE_USER_SIGNUP_EMAIL) {
    return ACCOUNT_SIGNUP_MODE_USER_SIGNUP_EMAIL;
  }
  return undefined;
};

export const getWebAccountSignupModeCapabilities = (
  value: string | undefined
): WebAccountSignupModeCapabilities => {
  const parsed = parseWebAccountSignupMode(value);
  if (parsed === ACCOUNT_SIGNUP_MODE_USER_SIGNUP_EMAIL) {
    return {
      canPublicSignup: true,
      canUseEmailVerificationFlows: true,
      canIssueAdminInviteLink: false,
      requiresEmailAtInviteCompletion: false,
    };
  }
  if (parsed === ACCOUNT_SIGNUP_MODE_ADMIN_ONLY_EMAIL) {
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
