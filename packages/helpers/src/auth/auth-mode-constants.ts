/**
 * Allowed ACCOUNT_SIGNUP_MODE / NEXT_PUBLIC_ACCOUNT_SIGNUP_MODE values. Single source for API and sidecar validation.
 */
export const ACCOUNT_SIGNUP_MODE_ADMIN_ONLY_USERNAME = 'admin_only_username';
export const ACCOUNT_SIGNUP_MODE_ADMIN_ONLY_EMAIL = 'admin_only_email';
export const ACCOUNT_SIGNUP_MODE_USER_SIGNUP_EMAIL = 'user_signup_email';

export const ACCOUNT_SIGNUP_MODE_VALUES = [
  ACCOUNT_SIGNUP_MODE_ADMIN_ONLY_USERNAME,
  ACCOUNT_SIGNUP_MODE_ADMIN_ONLY_EMAIL,
  ACCOUNT_SIGNUP_MODE_USER_SIGNUP_EMAIL,
] as const;

export type AccountSignupModeValue = (typeof ACCOUNT_SIGNUP_MODE_VALUES)[number];

export function normalizedAccountSignupMode(value: string | undefined | null): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  const t = value.trim().toLowerCase();
  return t === '' ? undefined : t;
}

export function isAccountSignupModeValue(normalized: string): boolean {
  return (ACCOUNT_SIGNUP_MODE_VALUES as readonly string[]).includes(normalized);
}
