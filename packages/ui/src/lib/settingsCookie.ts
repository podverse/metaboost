/**
 * Server-safe helpers for the settings cookie. No 'use client' — safe to call from Next.js server components (e.g. layout).
 * The cookie value is a JSON object; each app should use its own cookie name (e.g. web-settings, management-settings)
 * so settings do not overlap between apps.
 */

/** Supported theme values. Use this array for validation and UI options; add new themes here. */
export const THEMES = ['light', 'dark', 'dracula'] as const;

export type Theme = (typeof THEMES)[number];

function isTheme(value: string): value is Theme {
  return THEMES.includes(value as Theme);
}

/**
 * Parse a settings cookie value as a JSON object. Returns {} on empty or parse failure.
 * Use in server layout: getSettingsFromCookieValue(cookies().get('web-settings')?.value)
 */
export function getSettingsFromCookieValue(value: string | undefined): Record<string, unknown> {
  if (value === undefined || value === '') return {};
  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Parse theme from a settings cookie value (JSON object with optional theme key).
 * Use in server layout: getThemeFromSettingsCookieValue(cookies().get('web-settings')?.value)
 */
export function getThemeFromSettingsCookieValue(value: string | undefined): Theme | null {
  const settings = getSettingsFromCookieValue(value);
  const theme = settings.theme;
  return theme !== undefined && typeof theme === 'string' && isTheme(theme) ? theme : null;
}

/**
 * Parse locale from a settings cookie value (JSON object with optional locale key).
 * Returns the locale only if it is in the supported list.
 */
export function getLocaleFromSettingsCookieValue(
  value: string | undefined,
  supportedLocales: readonly string[]
): string | undefined {
  const settings = getSettingsFromCookieValue(value);
  const locale = settings.locale;
  if (locale !== undefined && typeof locale === 'string' && supportedLocales.includes(locale)) {
    return locale;
  }
  return undefined;
}
