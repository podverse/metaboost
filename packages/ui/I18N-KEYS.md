# UI package i18n keys

Components in `@boilerplate/ui` that render user-facing text use the **`ui`** namespace via `useTranslations('ui')`. Consuming apps (e.g. `apps/web`, `apps/management-web`) must provide a **`ui`** object in their message bundles with the keys below.

All keys are under `ui.*`. Use nested objects in your `i18n/originals/en-US.json` (and other locales) so that `t('auth.login.title')` resolves to `ui.auth.login.title`.

## auth.login

- `title` — Log in
- `email` — Email
- `password` — Password
- `placeholderEmail` — you@example.com
- `placeholderPassword` — ••••••••
- `submit` — Log in
- `signUp` — Sign up
- `forgotPassword` — Forgot password?

## auth.signup

- `title` — Sign up
- `email` — Email
- `displayName` — Display name (optional)
- `placeholderEmail` — you@example.com
- `placeholderDisplayName` — Your name
- `password` — Password
- `confirmPassword` — Confirm password
- `placeholderPassword` — ••••••••
- `submit` — Sign up
- `logIn` — Log in
- `prefix` — Already have an account?

## auth.forgotPassword

- `title` — Forgot password
- `email` — Email
- `placeholderEmail` — you@example.com
- `submit` — Send reset link
- `successTitle` — Check your email
- `successMessage` — If an account exists for that email, we sent a reset link.
- `backToLogin` — Back to log in

## auth.resetPassword

- `title` — Reset password
- `token` — Reset token
- `tokenPlaceholder` — Paste the token from your email
- `newPassword` — New password
- `confirmPassword` — Confirm new password
- `placeholderPassword` — ••••••••
- `submit` — Reset password
- `backToLogin` — Back to log in

## header

- `logout` — Logout
- `logIn` — Log in
- `userMenuAria` — User menu (aria-label)

## themeSelector

- `groupAriaLabel` — Theme (aria-label for the theme selector group)
- `useThemeAriaLabel` — Use {theme} theme (aria-label for each theme button; supports `theme` placeholder)
- `light` — Light (theme option label)
- `dark` — Dark (theme option label)
- `dracula` — Dracula (theme option label)

## passwordStrength

- `hint` — Use at least {minLength} characters and include a mix of letters, numbers, and symbols (supports `minLength` placeholder)

## loadingSpinner

- `ariaLabel` — Loading (aria-label for the spinner)

## tabs

- `navAriaLabel` — Section navigation (aria-label for the tab list)

## formLinks

- `separator` — • (bullet between links)

## rateLimitModal (RateLimitModal component)

- `title` — Too many attempts (modal heading)
- `bodyWithTime` — You can try again in {time}. (supports `time` placeholder; time is a localized duration from timeMinutes/timeSeconds)
- `bodyFallback` — You can try again in a few minutes. (when retry-after is unknown)
- `timeMinutes` — ICU plural: "{count, plural, one {# minute} other {# minutes}}" (duration in minutes; supports `count` placeholder)
- `timeSeconds` — ICU plural: "{count, plural, one {# second} other {# seconds}}" (duration in seconds; supports `count` placeholder)

## validation (auth form validation messages; used by useAuthValidation)

- `emailRequired` — Email is required
- `invalidEmail` — Enter a valid email address
- `fieldRequired` — {field} is required (supports `field` placeholder)
- `defaultPasswordLabel` — Password (default field label for password required message)
- `passwordMinLength` — Password must be at least {count} characters (supports `count` placeholder; use so locale can place number correctly)
- `passwordMaxLength` — Password must be no more than {count} characters (supports `count` placeholder)
