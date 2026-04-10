/**
 * Build PasswordValidationMessages for a locale. Used by API and management-api
 * so password validation errors returned to the client are translated.
 */

import type { PasswordValidationMessages } from '@boilerplate/helpers';

import { t } from './t.js';

/**
 * Returns locale-aware password validation messages for use with validatePassword.
 */
export function getPasswordValidationMessages(locale: string): PasswordValidationMessages {
  return {
    required: t(locale, 'password.required'),
    minLength: (min: number) => t(locale, 'password.minLength', { min }),
    maxLength: (max: number) => t(locale, 'password.maxLength', { max }),
    requirements: t(locale, 'password.requirements'),
  };
}
