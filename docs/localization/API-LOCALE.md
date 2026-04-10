# API locale and user-facing content

This document describes how the API (and management-api) handle locale for user-facing content. See [I18N.md](I18N.md) for the full i18n flow and adding locales.

## Message language rules

- **Structural API messages** (e.g. "Invalid or expired link", "Authentication required", "newEmail required") are **American English** and are not localized. Do not localize the `message` field for these responses.
- **User-facing content** is localized:
  - **Password validation messages** — Returned in 400 responses for signup, change-password, and reset-password. The API uses `getPasswordValidationMessages(locale)` so the client should send `Accept-Language` on those requests.
  - **Email content** — Verification, password reset, and email-change emails use subject/body from the resolved locale. The client should send `Accept-Language` on signup, forgot-password, and request-email-change so the email language matches the UI.

## How locale is resolved

- **Source:** The API resolves locale from the **Accept-Language** request header via `resolveLocale()` (in `packages/helpers-i18n/src/backend/resolve-locale.ts`).
- **When the header matches a supported locale:** English base (e.g. `en`, `en-US`, `en-GB`) maps to the supported English locale (e.g. `en-US`). Spanish base (`es`) maps to `es`. The API uses that locale for emails and password validation responses.
- **When the header is missing or only unsupported values (e.g. `fr`, `de`):** The API uses the **app default** from the **DEFAULT_LOCALE** environment variable (e.g. `en-US`). No database column is used for locale.
- **Supported locales:** Currently `en-US` and `es`. En variants map to `en-US`. The list is configurable via `SUPPORTED_LOCALES` (see [I18N.md](I18N.md)).

## Environment

- **DEFAULT_LOCALE** — Default when Accept-Language is missing or no value matches a supported locale. Example: `DEFAULT_LOCALE="en-US"`. Optional; unset means `en-US` (from package constants).
- **SUPPORTED_LOCALES** — Optional comma-separated list (e.g. `en-US,es`) or empty / `all-available` for all. See `apps/api/.env.example` and [I18N.md](I18N.md).

## Where email copy lives

Email subject and body text live in **`packages/helpers-i18n`**:

- **Originals:** `packages/helpers-i18n/i18n/originals/` (e.g. `en-US.json`, `es.json`) under keys like `email.verification.subject`, `email.passwordReset.body`, etc.
- **Overrides:** `packages/helpers-i18n/i18n/overrides/` for non–en-US corrections.
- **Compiled:** `packages/helpers-i18n/i18n/compiled/` (generated at build, not committed).

Run `npm run i18n:compile` and `npm run i18n:validate` when adding or changing email keys. See [I18N.md](I18N.md) for adding new locales.
