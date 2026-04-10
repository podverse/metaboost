/**
 * Allowed AUTH_MODE / NEXT_PUBLIC_AUTH_MODE values. Single source for API and sidecar validation.
 */
export const AUTH_MODE_ADMIN_ONLY_USERNAME = 'admin_only_username';
export const AUTH_MODE_ADMIN_ONLY_EMAIL = 'admin_only_email';
export const AUTH_MODE_USER_SIGNUP_EMAIL = 'user_signup_email';

export const AUTH_MODE_VALUES = [
  AUTH_MODE_ADMIN_ONLY_USERNAME,
  AUTH_MODE_ADMIN_ONLY_EMAIL,
  AUTH_MODE_USER_SIGNUP_EMAIL,
] as const;

export type AuthModeValue = (typeof AUTH_MODE_VALUES)[number];

export function normalizedAuthMode(value: string | undefined | null): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  const t = value.trim().toLowerCase();
  return t === '' ? undefined : t;
}

export function isAuthModeValue(normalized: string): boolean {
  return (AUTH_MODE_VALUES as readonly string[]).includes(normalized);
}
