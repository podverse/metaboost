/**
 * Test helpers: restore `process.env` after a suite that overrides `AUTH_MODE` or mailer-related
 * variables, so the next file matches `src/test/setup.ts` defaults. API `config.authMode` and
 * `config.authModeCapabilities` are read lazily (see `src/config/index.ts`), so you do not need
 * `vi.resetModules()`.
 */
export function restoreDefaultApiTestProcessEnv(): void {
  process.env.AUTH_MODE = 'admin_only_username';
  delete process.env.MAILER_HOST;
  delete process.env.MAILER_PORT;
  delete process.env.MAILER_FROM;
  delete process.env.WEB_BASE_URL;
}

/**
 * `user_signup_email` and related tests need mailer + web base; admin invite completion
 * needs the same. Matches prior top-of-file assignments in those suites.
 */
export function applyUserSignupApiTestProcessEnvWithMailer(): void {
  process.env.AUTH_MODE = 'user_signup_email';
  process.env.MAILER_HOST = 'localhost';
  process.env.MAILER_PORT = '25';
  process.env.MAILER_FROM = 'test@test.com';
  process.env.WEB_BASE_URL = 'http://localhost:3999';
}

/**
 * `admin_only_email` invite / set-password tests need this mailer + URL shape.
 */
export function applyAdminOnlyEmailApiTestProcessEnv(): void {
  process.env.AUTH_MODE = 'admin_only_email';
  process.env.MAILER_HOST = 'localhost';
  process.env.MAILER_PORT = '25';
  process.env.MAILER_FROM = 'test@test.com';
  process.env.WEB_BASE_URL = 'http://localhost:3999';
}

/**
 * `user_signup_email` with no mailer env (tests that seed users via ORM only; matches
 * prior top-of-file that set only `AUTH_MODE`).
 */
export function applyUserSignupEmailNoMailerApiTestProcessEnv(): void {
  process.env.AUTH_MODE = 'user_signup_email';
  delete process.env.MAILER_HOST;
  delete process.env.MAILER_PORT;
  delete process.env.MAILER_FROM;
  delete process.env.WEB_BASE_URL;
}
