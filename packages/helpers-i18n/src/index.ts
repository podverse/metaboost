/**
 * Re-exports locale constants from @metaboost/helpers and backend-only i18n for API/management-api.
 * Backend modules (load, t, resolveLocale, password-messages, email-messages) live under backend/ and use Node/disk.
 */

export { ALL_AVAILABLE_LOCALES, DEFAULT_LOCALE, type Locale } from '@metaboost/helpers';
export {
  getVerificationEmailContent,
  getPasswordResetEmailContent,
  getEmailChangeVerificationContent,
  loadMessages,
  getPasswordValidationMessages,
  resolveLocale,
  t,
} from './backend/index.js';
export { formatDateTimeReadable, type FormatDateTimeOptions } from './format-date.js';
