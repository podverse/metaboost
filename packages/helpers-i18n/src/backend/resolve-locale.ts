/**
 * Resolve locale from Accept-Language header. Aligned with web/management-web
 * supported locales and default. Used by API and management-api to choose
 * language for user-facing messages (password validation, emails).
 * Backend only: uses process.env for DEFAULT_LOCALE / SUPPORTED_LOCALES.
 */

import { ALL_AVAILABLE_LOCALES, DEFAULT_LOCALE, type Locale } from '@metaboost/helpers';

/**
 * Parse Accept-Language and return the first matching supported locale, or app default from env.
 * Supports env DEFAULT_LOCALE and SUPPORTED_LOCALES (same semantics as web apps).
 * Only uses getDefaultLocale() when header is empty or no header value matches a supported locale.
 */
export function resolveLocale(acceptLanguageHeader: string | undefined): string {
  const supported = getSupportedLocales();
  if (supported.length === 0) return getDefaultLocale();
  if (acceptLanguageHeader === undefined || acceptLanguageHeader.trim() === '') {
    const defaultLocale = getDefaultLocale();
    return supported.includes(defaultLocale) ? defaultLocale : (supported[0] ?? defaultLocale);
  }
  const preferred = acceptLanguageHeader
    .split(',')
    .map((part) => part.split(';')[0]?.trim() ?? '')
    .filter(Boolean);
  for (const lang of preferred) {
    if (supported.includes(lang)) return lang;
    const base = lang.split('-')[0];
    // Any base (en, es, fr, …) maps to a supported locale that matches: exact base or base-*.
    if (base) {
      const match = supported.find((s) => s === base || s.startsWith(`${base}-`));
      if (match !== undefined) return match;
    }
  }
  const defaultLocale = getDefaultLocale();
  return supported.includes(defaultLocale) ? defaultLocale : (supported[0] ?? defaultLocale);
}

function getDefaultLocale(): string {
  const v = process.env.DEFAULT_LOCALE?.trim();
  if (v === undefined || v === '') return DEFAULT_LOCALE;
  return ALL_AVAILABLE_LOCALES.includes(v as Locale) ? v : DEFAULT_LOCALE;
}

function getSupportedLocales(): string[] {
  const v = process.env.SUPPORTED_LOCALES?.trim();
  if (v === undefined || v === '' || v === 'all-available') {
    return [...ALL_AVAILABLE_LOCALES];
  }
  const list = v
    .split(',')
    .map((s) => s.trim())
    .filter((s): s is Locale => s !== '' && ALL_AVAILABLE_LOCALES.includes(s as Locale));
  return list.length > 0 ? list : [getDefaultLocale()];
}
