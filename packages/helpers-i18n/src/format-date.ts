/**
 * Client-safe date/time formatting using Intl.DateTimeFormat.
 * Use for human-readable, locale-aware display with optional timezone.
 */

import { ALL_AVAILABLE_LOCALES, DEFAULT_LOCALE } from '@boilerplate/helpers';

export type FormatDateTimeOptions = {
  dateStyle?: 'short' | 'medium' | 'long';
  timeStyle?: 'short' | 'medium';
  includeTimezone?: boolean;
};

const DEFAULT_OPTIONS: Required<FormatDateTimeOptions> = {
  dateStyle: 'medium',
  timeStyle: 'short',
  includeTimezone: true,
};

function resolveLocale(locale: string): string {
  if (typeof locale !== 'string' || locale.trim() === '') {
    return DEFAULT_LOCALE;
  }
  const trimmed = locale.trim();
  const allowed = new Set(ALL_AVAILABLE_LOCALES);
  return allowed.has(trimmed as (typeof ALL_AVAILABLE_LOCALES)[number]) ? trimmed : DEFAULT_LOCALE;
}

/**
 * Formats a date for display in a given locale, with optional timezone.
 * Accepts ISO string or Date. Uses Intl.DateTimeFormat (Node and browser).
 * Locale is validated against project-supported locales; invalid/empty falls back to default.
 */
export function formatDateTimeReadable(
  locale: string,
  date: Date | string,
  options?: FormatDateTimeOptions
): string {
  const resolvedLocale = resolveLocale(locale);
  const resolved: Required<FormatDateTimeOptions> = {
    ...DEFAULT_OPTIONS,
    ...options,
  };
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  const formatOptions: Intl.DateTimeFormatOptions = {
    dateStyle: resolved.dateStyle,
    timeStyle: resolved.timeStyle,
    ...(resolved.includeTimezone ? { timeZoneName: 'short' } : {}),
  };
  try {
    return new Intl.DateTimeFormat(resolvedLocale, formatOptions).format(d);
  } catch {
    // Fallback for runtimes that don't support dateStyle/timeStyle (e.g. some Node/Edge)
    const fallbackOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      ...(resolved.includeTimezone ? { timeZoneName: 'short' } : {}),
    };
    return new Intl.DateTimeFormat(resolvedLocale, fallbackOptions).format(d);
  }
}
