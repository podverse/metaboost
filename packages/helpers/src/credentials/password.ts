/**
 * Password strength and validation. Shared by API, management-api, and apps for consistent rules.
 * Aligns with common practice: min length 8, encourage variety (lower, upper, digit, symbol).
 *
 * All user-facing messages are i18n-compatible: callers pass translated strings via the
 * required `messages` option so that character counts and wording can be placed correctly
 * for each locale (e.g. "At least {count} characters" vs different word order in other languages).
 */

import { PASSWORD_MAX_LENGTH } from '../db/field-lengths.js';

/** Minimum length (NIST/OWASP common minimum). */
export const PASSWORD_MIN_LENGTH = 8;

/** Minimum strength (0–4) required to accept a password. 2 = at least two character types. */
export const PASSWORD_MIN_STRENGTH = 2;

export type PasswordStrength = 0 | 1 | 2 | 3 | 4;

/**
 * Returns strength 0–4 based on length and character variety (lower, upper, digit, symbol).
 * 0 = too short or empty; 1–4 = number of character sets present (with min length met).
 */
export function getPasswordStrength(password: string): PasswordStrength {
  if (password.length < PASSWORD_MIN_LENGTH) return 0;
  let sets = 0;
  if (/[a-z]/.test(password)) sets += 1;
  if (/[A-Z]/.test(password)) sets += 1;
  if (/\d/.test(password)) sets += 1;
  if (/[^a-zA-Z0-9]/.test(password)) sets += 1;
  return Math.min(4, sets) as PasswordStrength;
}

export type PasswordValidationResult = { valid: true } | { valid: false; message: string };

/**
 * Caller-provided messages for validation errors. Required so that all text is i18n-friendly:
 * the app (or API) supplies translated strings and controls where numbers/placeholders go.
 *
 * - required: message when password is empty (e.g. "Password is required").
 * - minLength: function(min) → message; use t('passwordMinLength', { count: min }) so the
 *   translation can place {count} in the correct position for the locale.
 * - maxLength: function(max) → message; use t('passwordMaxLength', { count: max }).
 * - requirements: message for strength/variety (e.g. "Use at least X characters and include
 *   a mix of letters, numbers, and symbols"); translation controls full wording and order.
 */
export type PasswordValidationMessages = {
  required: string;
  minLength: (min: number) => string;
  maxLength: (max: number) => string;
  requirements: string;
};

/**
 * Validates password: min length, max length, and minimum strength (variety).
 * Messages are required so callers can supply i18n strings and control placeholder order.
 */
export function validatePassword(
  password: string,
  messages: PasswordValidationMessages
): PasswordValidationResult {
  if (password.length === 0) {
    return { valid: false, message: messages.required };
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      valid: false,
      message: messages.minLength(PASSWORD_MIN_LENGTH),
    };
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return {
      valid: false,
      message: messages.maxLength(PASSWORD_MAX_LENGTH),
    };
  }
  const strength = getPasswordStrength(password);
  if (strength < PASSWORD_MIN_STRENGTH) {
    return {
      valid: false,
      message: messages.requirements,
    };
  }
  return { valid: true };
}

/**
 * Returns true if the password meets min length, max length, and minimum strength.
 * Use when you only need a validity check (e.g. enabling submit) and do not need an error message.
 */
export function isPasswordValid(password: string): boolean {
  if (password.length === 0) return false;
  if (password.length < PASSWORD_MIN_LENGTH) return false;
  if (password.length > PASSWORD_MAX_LENGTH) return false;
  const strength = getPasswordStrength(password);
  return strength >= PASSWORD_MIN_STRENGTH;
}
