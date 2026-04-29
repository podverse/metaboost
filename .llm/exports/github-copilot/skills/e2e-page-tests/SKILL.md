---
name: e2e-page-tests
description: When layout, functionality, or conditions change in apps/web or apps/management-web, add or update the corresponding E2E (Playwright) test so page behavior stays covered.
version: 1.3.4
---


# E2E Page Tests (Web and Management-Web)

Testing requirement policy lives in **feature-implementation-testing**. This skill focuses on **how** to add or update E2E coverage for web and management-web changes.

Current E2E bar: **Confident**. Use this skill when you change **layout**, **functionality**, or **conditions** (e.g. redirects, auth checks, visibility, error states) in `apps/web` or `apps/management-web`. Always add or update an E2E test so the change is covered and regressions are caught. **Updating E2E tests is required for functional changes to web or management-web; it must not be treated or listed as optional in plans or implementation reports.**

## When to add or update a test

- **Layout changes** – New or moved sections, nav, headings, or structure on a page.
- **Functionality changes** – New or changed forms, buttons, links, or user flows (e.g. create bucket, edit message, login).
- **Condition changes** – New or changed redirects, auth guards, visibility rules, or error/empty states.

For CRUD and permission-gated flows, also apply **e2e-crud-state-matrix** and, for permission-gated pages, **e2e-permission-actor-matrix**.
For query-param state behavior, also apply **e2e-url-state-contracts**.
For test-title/step readability and report behavior, also apply **e2e-readability**.

If the change is in **web**, add or update a spec in `apps/web/e2e/`. If it is in **management-web**, add or update a spec in `apps/management-web/e2e/`. When **adding** a new spec file, update the corresponding E2E spec order file so the full report stays in conceptual order (see **e2e-report-order** skill).

**End your response with exact E2E verification commands.** Whenever you add, change, or remove E2E specs or change UI that E2E tests cover, you **MUST** end the response with a fenced `bash` block containing the **EXACT** `make` command(s) the user needs to run to verify the change (e.g. `make e2e_test_web_report_spec SPEC=e2e/settings-bucket-owner.spec.ts`). See **response-ending-make-verify** skill. No exception.

## Deterministic outcome policy (required)

- Each E2E test must have **one deterministic expected outcome** for the mode/config it runs under.
- **No dual-condition or mode-agnostic tests.** Do not write a single test that accepts "either outcome A or outcome B" (e.g. "either success message or error message") depending on config or env. Such tests hide regressions and violate single-outcome policy.
- **Do not permit dual outcomes** such as "either error message A or redirect B." Use one assertion path per test.
- Do not use `Promise.race(...)` or broad regex patterns to accept multiple incompatible outcomes.
- **Separate spec files per mode (avoid `test.skip()`).** When behavior is mode-dependent (e.g. `ACCOUNT_SIGNUP_MODE=admin_only_username` vs `ACCOUNT_SIGNUP_MODE=admin_only_email` or `user_signup_email`), use **separate spec files per mode** (e.g. `settings-bucket-owner.spec.ts` for default, `settings-bucket-owner-admin-only-email.spec.ts` for admin-only-email) and run each spec only under the config where that outcome is guaranteed. Do **not** use `test.skip()` to gate mode-dependent tests so that "skipped" is not necessary; each file has a single outcome per test and runs in one config.
- A test should fail when the non-target mode behavior appears.

## Timeout increases are almost never the fix (required)

- Do **not** resolve failing or flaky E2E tests by increasing timeout values (`test.setTimeout(...)`, `test.slow()`, Playwright `timeout`, `expect.timeout`, or per-call `{ timeout: ... }`) as the first response.
- In nearly all cases, timeout failures indicate a readiness, determinism, or assertion issue, not that tests should simply wait longer.
- Fix root cause first:
  - add explicit destination-load verification after navigation (URL and destination-specific visible element),
  - assert the specific success/error state tied to the user action,
  - use deterministic setup data (especially for one-time tokens and links),
  - remove arbitrary sleeps in favor of condition-based waits.
- If a timeout increase is truly unavoidable, treat it as a rare exception: document why inline in the spec and keep the increase minimal.

## Where tests live

| App                 | Specs directory            | Config                                         |
| ------------------- | -------------------------- | ---------------------------------------------- |
| apps/web            | `apps/web/e2e/`            | `apps/web/playwright.config.ts` (default)      |
| apps/web (signup)   | `apps/web/e2e/`            | `apps/web/playwright.signup-enabled.config.ts` |
| apps/management-web | `apps/management-web/e2e/` | `apps/management-web/playwright.config.ts`     |

- **Default web E2E** uses `ACCOUNT_SIGNUP_MODE=admin_only` (signup disabled). For signup-enabled auth flows (signup, forgot-password, reset-password), use `make e2e_test_web_signup_enabled`; it starts Mailpit via `infra/docker/e2e/docker-compose.yml` and uses the signup-enabled config. `make test_clean` removes Mailpit with other test containers. See [docs/testing/E2E-PAGE-TESTING.md](../../../docs/testing/E2E-PAGE-TESTING.md) (“E2E and ACCOUNT_SIGNUP_MODE”).
- Use the **deterministic E2E seed** for data (e.g. `e2e-bucket-owner@example.com` / `Test!1Aa` for web bucket-owner; management-web login is by username `e2e-superadmin` and password `Test!1Aa`). See [docs/testing/E2E-PAGE-TESTING.md](../../../docs/testing/E2E-PAGE-TESTING.md).
- **API gate**: E2E Make targets run API integration tests first; if they fail, Playwright does not run.
- **Current startup model**: Playwright `webServer` now auto-starts the required API + web apps on dedicated E2E ports in production-like mode (`build` + `start`), so manual app startup is not part of normal E2E runs.

## Rate limiting and auth in E2E

- **Rate limiting disabled in test**: In test, rate limits are effectively disabled (very high limit) so E2E and API integration tests never hit 429. Do not add tests (E2E or API) that assert rate-limit behavior (e.g. 429 after N requests); see api-testing skill.

## Placeholder plans

Page-level coverage is tracked in `.llm/plans/active/e2e-page-tests/` (e.g. `web-03-dashboard.md`, `mgmt-06-bucket-detail.md`). When you add or expand a test for a page, consider updating the corresponding placeholder with the new scenarios or marking it as implemented.

## Quick reference

- **Default execution strategy (agent/sandbox):** use the leanest E2E command that validates the change first (single spec/report-spec target), then broaden only when required.
- **Most targeted web E2E run:** `make e2e_test_web_report_spec SPEC=e2e/<spec>.spec.ts`
- **Most targeted management-web E2E run:** `make e2e_test_management_web_report_spec SPEC=e2e/<spec>.spec.ts`
- **Run E2E (web only):** `make e2e_test_web`
- **Run E2E (management-web only):** `make e2e_test_management_web`.
- **Run E2E (both):** `make e2e_test`.
- **Run report-focused home smoke (auto-opens HTML reports, captures step screenshots):** `make e2e_test_home_report`.
- **Signup-enabled web E2E** (signup + forgot/reset auth pages; starts Mailpit, report to `web-signup-enabled/`): `make e2e_test_web_signup_enabled`.
- **Admin-only-email web E2E (scoped report):** `make e2e_test_web_admin_only_email_report_spec SPEC=e2e/<spec>.spec.ts` (e.g. `SPEC=e2e/settings-bucket-owner-admin-only-email.spec.ts`). Full suite: `make e2e_test_web_admin_only_email`.
- **Docs:** [docs/testing/E2E-PAGE-TESTING.md](../../../docs/testing/E2E-PAGE-TESTING.md).

Report mode uses a custom reporter (`scripts/e2e-html-steps-reporter.ts`) so each
step screenshot is shown with its full "Step description" in an expandable block
directly below the image; when the capture helper attaches a "Step URL", the report
shows that URL in the same block. The report UI includes a fixed top-right indicator
showing which test you are viewing (e.g. 3 / 12) and fixed bottom-right nav (prev/next
test, shot, error).

### Report title and meta title (required)

Every E2E HTML report must use a **descriptive title** in the page heading and `<title>` (browser tab), not a generic label like "E2E step report". The required pattern is:

- **Web (default or scoped):** `E2E Web Report - e2e/<spec>.spec.ts` (or comma-separated spec paths when multiple).
- **Web admin-only-email:** same pattern; output dir must be `web-admin-only-email` so the reporter uses the Web Report title and appends `E2E_REPORT_SPEC`.
- **Web signup-enabled:** `E2E Web Report – ACCOUNT_SIGNUP_MODE=user_signup_email, MAILER_ENABLED=true` with optional ` - e2e/<spec>...` when scoped.
- **Management-web:** `E2E Management Web Report - e2e/<spec>.spec.ts`.

The reporter derives the title from `PLAYWRIGHT_HTML_OUTPUT_DIR` (must end with one of: `web`, `web-admin-only-email`, `web-signup-enabled`, `management-web`) and `E2E_REPORT_SPEC` (spec path or comma-separated list). When adding or changing Make report targets, always set `E2E_REPORT_SPEC` and use one of these output dirs so the generated report has the correct heading and meta title.

## Screenshot naming policy (QA-readable)

When adding or updating screenshot steps in E2E specs:

- Use `actionAndCapture` / `capturePageLoad` from `e2e/helpers/stepScreenshots`.
- Keep screenshot capture report-focused (`E2E_STEP_SCREENSHOTS=true` runs such as `e2e_test_home_report`).
- **Use very descriptive step labels** that explain expected visible UI outcome, not short action codes.
- Prefer long, explicit labels over short ambiguous labels so QA can infer expected state from filename alone.

Good label examples:

- `User navigates to the home route and is redirected to the login page for an unauthenticated session.`
- `The dashboard screen is visible with the primary heading after successful login.`

Avoid labels like:

- `goto-home`
- `click-login`
