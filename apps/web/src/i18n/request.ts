import type { AbstractIntlMessages } from 'use-intl/core';

import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

import { ALL_AVAILABLE_LOCALES, DEFAULT_LOCALE, type Locale } from '@metaboost/helpers';
import { getLocaleFromSettingsCookieValue } from '@metaboost/ui';

import { getDefaultLocaleEnv, getSupportedLocalesEnv } from '../config/env';

const SETTINGS_COOKIE_NAME = 'web-settings';

function getDefaultLocale(): string {
  const v = getDefaultLocaleEnv();
  if (!v) return DEFAULT_LOCALE;
  return ALL_AVAILABLE_LOCALES.includes(v as Locale) ? v : DEFAULT_LOCALE;
}

function getSupportedLocales(): string[] {
  const v = getSupportedLocalesEnv();
  if (v === undefined || v === '' || v === 'all-available') {
    return [...ALL_AVAILABLE_LOCALES];
  }
  const list = v
    .split(',')
    .map((s) => s.trim())
    .filter((s): s is Locale => s !== '' && ALL_AVAILABLE_LOCALES.includes(s as Locale));
  return list.length > 0 ? list : [getDefaultLocale()];
}

async function detectLocale(): Promise<string> {
  const defaultLocale = getDefaultLocale();
  const supported = getSupportedLocales();
  const effectiveDefault = supported.includes(defaultLocale)
    ? defaultLocale
    : (supported[0] ?? defaultLocale);

  const cookieStore = await cookies();
  const settingsCookieValue = cookieStore.get(SETTINGS_COOKIE_NAME)?.value;
  const localeFromSettings = getLocaleFromSettingsCookieValue(settingsCookieValue, supported);
  if (localeFromSettings !== undefined) {
    return localeFromSettings;
  }
  const nextLocale = cookieStore.get('NEXT_LOCALE')?.value;
  if (nextLocale && supported.includes(nextLocale)) {
    return nextLocale;
  }
  const hdrs = await headers();
  const acceptLanguage = hdrs.get('accept-language');
  if (acceptLanguage) {
    const preferred = acceptLanguage
      .split(',')
      .map((lang) => lang.split(';')[0]?.trim() ?? '')
      .filter(Boolean);
    for (const lang of preferred) {
      if (supported.includes(lang)) return lang;
      const base = lang.split('-')[0];
      // English (any variant) always maps to en-US; never return bare "en".
      if (base === 'en') return DEFAULT_LOCALE;
      if (base && supported.includes(base)) return base;
    }
  }
  return effectiveDefault;
}

async function loadCompiledMessages(locale: string): Promise<Record<string, unknown>> {
  const fallbackLocale = getDefaultLocale();
  try {
    const mod = await import(`../../i18n/compiled/${locale}.json`);
    return (mod.default ?? mod) as Record<string, unknown>;
  } catch {
    const mod = await import(`../../i18n/compiled/${fallbackLocale}.json`);
    return (mod.default ?? mod) as Record<string, unknown>;
  }
}

export default getRequestConfig(async () => {
  const locale = await detectLocale();
  const messages = (await loadCompiledMessages(locale)) as AbstractIntlMessages;
  return { locale, messages };
});
