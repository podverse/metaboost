'use client';

import { useTranslations } from 'next-intl';

import { PASSWORD_MIN_LENGTH } from '@metaboost/helpers';

import { validateEmailWithT, validatePasswordWithT } from '../lib/validation';

/**
 * Returns validateEmail and validatePassword that use the ui namespace for
 * translated error messages. Use in auth pages (login, signup, forgot-password,
 * reset-password) so validation and messaging are consistent across apps.
 */
export function useAuthValidation(): {
  validateEmail: (value: string) => string | null;
  validatePassword: (value: string, fieldLabel?: string) => string | null;
} {
  const t = useTranslations('ui');

  const authT = {
    emailRequired: t('validation.emailRequired'),
    invalidEmail: t('validation.invalidEmail'),
    fieldRequired: (params: { field: string }) =>
      t('validation.fieldRequired', { field: params.field }),
    defaultPasswordLabel: t('validation.defaultPasswordLabel'),
    passwordValidationMessages: (fieldLabel: string) => ({
      required: t('validation.fieldRequired', { field: fieldLabel }),
      minLength: (min: number) => t('validation.passwordMinLength', { count: min }),
      maxLength: (max: number) => t('validation.passwordMaxLength', { count: max }),
      requirements: t('passwordStrength.hint', { minLength: PASSWORD_MIN_LENGTH }),
    }),
  };

  return {
    validateEmail: (value: string) => validateEmailWithT(value, authT),
    validatePassword: (value: string, fieldLabel?: string) =>
      validatePasswordWithT(value, authT, fieldLabel),
  };
}
