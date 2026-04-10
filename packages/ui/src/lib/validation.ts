/**
 * Auth form validation (email, password). Uses @boilerplate/helpers for password rules.
 * Use the useAuthValidation hook so messages are translated via the ui namespace.
 */

import type { PasswordValidationMessages } from '@boilerplate/helpers';

import { validatePassword as validatePasswordHelper } from '@boilerplate/helpers';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type AuthValidationTranslations = {
  emailRequired: string;
  invalidEmail: string;
  fieldRequired: (params: { field: string }) => string;
  defaultPasswordLabel: string;
  /** Builds i18n messages for password validation (min/max length, requirements). */
  passwordValidationMessages: (fieldLabel: string) => PasswordValidationMessages;
};

/**
 * Validates email; returns translated error message or null.
 */
export function validateEmailWithT(value: string, t: AuthValidationTranslations): string | null {
  if (value.trim() === '') return t.emailRequired;
  if (!EMAIL_REGEX.test(value)) return t.invalidEmail;
  return null;
}

/**
 * Validates password (length, strength via helpers); returns translated error message or null.
 * @param fieldLabel - Translated label for "X is required" (e.g. "Password" or "Confirm password").
 */
export function validatePasswordWithT(
  value: string,
  t: AuthValidationTranslations,
  fieldLabel?: string
): string | null {
  const label = fieldLabel ?? t.defaultPasswordLabel;
  if (value === '') return t.fieldRequired({ field: label });
  const messages = t.passwordValidationMessages(label);
  const result = validatePasswordHelper(value, messages);
  if (result.valid) return null;
  return result.message;
}
