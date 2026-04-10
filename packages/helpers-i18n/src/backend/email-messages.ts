/**
 * Locale-aware email subject/body for API mailer (verification, password reset, email change).
 * Only used by apps/api; management-api does not send transactional email.
 */

import { t } from './t.js';

export function getVerificationEmailContent(
  locale: string,
  link: string,
  brand: string
): {
  subject: string;
  text: string;
  html: string;
} {
  return {
    subject: t(locale, 'email.verifySubject', { brand }),
    text: t(locale, 'email.verifyText', { link, brand }),
    html: t(locale, 'email.verifyHtml', { link, brand }),
  };
}

export function getPasswordResetEmailContent(
  locale: string,
  link: string,
  brand: string
): {
  subject: string;
  text: string;
  html: string;
} {
  return {
    subject: t(locale, 'email.resetSubject', { brand }),
    text: t(locale, 'email.resetText', { link, brand }),
    html: t(locale, 'email.resetHtml', { link, brand }),
  };
}

export function getEmailChangeVerificationContent(
  locale: string,
  link: string,
  brand: string
): {
  subject: string;
  text: string;
  html: string;
} {
  return {
    subject: t(locale, 'email.confirmEmailChangeSubject', { brand }),
    text: t(locale, 'email.confirmEmailChangeText', { link, brand }),
    html: t(locale, 'email.confirmEmailChangeHtml', { link, brand }),
  };
}
