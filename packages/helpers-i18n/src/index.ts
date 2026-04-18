/**
 * Full package entry (Node servers: API, management-api). Includes backend loaders (fs).
 * For Next.js client code or date formatting only, import from `@metaboost/helpers-i18n/client`.
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
