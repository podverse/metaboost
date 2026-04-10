/**
 * Locale constants shared across web, management-web, and backend i18n (helpers-i18n).
 * Single source of truth so default and supported locales stay in sync project-wide.
 * Update when adding or changing supported locales; sync docs and i18n skill.
 */

/** All locales that have (or can have) originals/compiled messages. Same for all apps and backend. */
export const ALL_AVAILABLE_LOCALES = ['en-US', 'es'] as const;

export type Locale = (typeof ALL_AVAILABLE_LOCALES)[number];

/** Default locale when none is specified or resolved. */
export const DEFAULT_LOCALE: Locale = 'en-US';
