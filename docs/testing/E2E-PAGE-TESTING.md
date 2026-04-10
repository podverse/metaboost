# E2E Page Testing (Web and Management-Web)

End-to-end testing for web and management-web page layouts and interactions. Every page
and interaction (without entering infinite loops) should be covered, with deterministic
outcomes via fixed seed data.

## Purpose

- Test every page layout and interaction for apps/web and apps/management-web.
- Guarantee the same results and values each run using predefined, constant data
  seeded in the database before tests.
- **Configurable API gate**: E2E targets support `E2E_API_GATE_MODE=off|on|auto`.
  - `off` (default): skip API integration tests; run seed + Playwright only. Use this for E2E-only verification.
  - `on`: always run API + management-api integration tests before Playwright. Pass before the make command when your change affected API or integration tests (e.g. `make E2E_API_GATE_MODE=on e2e_test_web_report_spec SPEC=...`).
  - `auto`: run API gate only when changed files look API-impacting.

## Prerequisites

- Node.js 24+, npm, Docker (Postgres, Valkey).
- Nix users: run commands via `./scripts/nix/with-env <command>` from repo root.
- Playwright browser binaries installed locally (e.g. `./scripts/nix/with-env npx playwright install chromium`).

For a copy-paste list of **one-spec report commands** (run each spec in isolation with reports), see [E2E-SPEC-REPORT-COMMANDS.md](E2E-SPEC-REPORT-COMMANDS.md). CRUD/state/auth checklists (Confident bar): [E2E-CRUD-STATE-AUTH-MATRICES.md](E2E-CRUD-STATE-AUTH-MATRICES.md).

## Make targets

| Target                                | Description                                                                                                                                                                                                                                       |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `e2e_deps`                            | Start Postgres (5532), Valkey (6479), create test DBs and schema.                                                                                                                                                                                 |
| `e2e_seed`                            | Load deterministic seed for both web and management-web.                                                                                                                                                                                          |
| `e2e_seed_web`                        | Load deterministic seed for web E2E only (main DB).                                                                                                                                                                                               |
| `e2e_seed_management_web`             | Load deterministic seed for management-web E2E only.                                                                                                                                                                                              |
| `e2e_test_api`                        | Run API integration tests only (api + management-api).                                                                                                                                                                                            |
| `e2e_test`                            | Run API gate decision, then E2E for default web, signup-enabled web, admin-only-email web (Mailpit started automatically), and management-web.                                                                                                    |
| `e2e_test_web`                        | Run API gate decision, then E2E for web: default specs then signup-enabled spec (Mailpit started automatically).                                                                                                                                  |
| `e2e_test_management_web`             | Run API gate decision, then E2E for management-web only.                                                                                                                                                                                          |
| `e2e_test_web_report_spec`            | Run one or more web specs in report mode with step screenshots (`SPEC=...`) and auto-open the report.                                                                                                                                             |
| `e2e_test_management_web_report_spec` | Run one or more management-web specs in report mode with step screenshots (`SPEC=...`) and auto-open the report.                                                                                                                                  |
| `e2e_test_report_scoped`              | Run one or more web specs + one or more management-web specs in report mode (`WEB_SPEC=... MGMT_SPEC=...`) and auto-open both reports.                                                                                                            |
| `e2e_test_report`                     | Run full E2E suite: one run per web auth mode (default, signup-enabled, admin-only-email) and management-web; four report dirs (web, web-signup-enabled, web-admin-only-email, management-web); step screenshots and auto-open all four.          |
| `e2e_mailpit_up`                      | Start Mailpit via `infra/docker/e2e/docker-compose.yml` (SMTP 1025, web UI 8025); idempotent. Optional: `e2e_mailpit_down`, `e2e_mailpit_clean`. `make test_clean` also removes it. `make test_deps` starts Mailpit so full E2E prep is complete. |
| `e2e_test_web_signup_enabled`         | Run signup-enabled web auth E2E specs (signup, forgot-password, reset-password) with `AUTH_MODE=user_signup_email` and Mailpit; report to `web-signup-enabled/`.                                                                                  |
| `e2e_test_web_admin_only_email`       | Run admin-only-email web auth E2E specs (login link visibility, signup unavailable, forgot/reset available, set-password fields) with `AUTH_MODE=admin_only_email`; report to `web-admin-only-email/`.                                            |
| `e2e_teardown`                        | Stop processes started for E2E (dev servers, API, sidecar).                                                                                                                                                                                       |

**API gate behavior**:

- Default is `E2E_API_GATE_MODE=off`: API integration tests are **not** run. E2E verification commands (e2e_test_web_report_spec, etc.) skip API tests unless you pass the env var.
- To include API tests, pass `E2E_API_GATE_MODE=on` before the command (e.g. `make E2E_API_GATE_MODE=on e2e_test_web_report_spec SPEC=...`).
- `E2E_API_GATE_MODE=auto` inspects unstaged + staged + untracked files and runs API integration tests only when API-impacting paths are detected.
- Full API test coverage: run `npm run test` (single run; setup has smart defaults; tests that need signup/mailer env override per-file and load app in beforeAll). See AGENTS.md (Testing).

## Flow

1. **`make e2e_deps`** — Test DBs and schema (same as `test_deps`: Postgres 5532,
   Valkey 6479, `metaboost_app_test`, `metaboost_management_test`).
2. **`make e2e_seed`** — Load deterministic fixtures (idempotent: truncate + insert).
3. **Run API gate decision** — by default (`off`), Make skips API integration tests. Pass
   `E2E_API_GATE_MODE=on` to run them; `E2E_API_GATE_MODE=auto` to run only when changed paths look API-impacting.
4. Run Playwright (e.g. `make e2e_test_web` or `make e2e_test_management_web`).
   - Web E2E auto-starts API (`4010`), sidecar (`4011`), and web (`4012`) in production-like mode (`build` + `start`).
   - Management-web E2E auto-starts management-api (`4110`), management-web runtime sidecar (`4111`), and management-web (`4112`) in production-like mode (`build` + `start` for API and Next; sidecar via `dev:sidecar` with explicit env).
5. **`make e2e_teardown`** — Stop any manually started services. For full cleanup (remove test containers),
   run `make test_clean`.

Force strict gate mode when needed:

- `make E2E_API_GATE_MODE=on e2e_test_web`
- `make E2E_API_GATE_MODE=on e2e_test_management_web`
- `make E2E_API_GATE_MODE=on e2e_test_report_scoped WEB_SPEC=e2e/<web-spec>.spec.ts MGMT_SPEC=e2e/<management-spec>.spec.ts`

Spec-list format:

- `SPEC`, `WEB_SPEC`, and `MGMT_SPEC` accept either:
  - a single spec path, or
  - a comma-separated list of spec paths.
- Example (multiple specs):
  - `make e2e_test_web_report_spec SPEC=e2e/buckets.spec.ts,e2e/invite.spec.ts`
  - `make e2e_test_report_scoped WEB_SPEC=e2e/buckets.spec.ts,e2e/bucket-detail.spec.ts MGMT_SPEC=e2e/buckets.spec.ts,e2e/events.spec.ts`

Report order:

- **Full report** (`make e2e_test_report`): Produces three report dirs: **web**, **web-signup-enabled**, and **management-web**. The HTML report **display** order is **conceptual** (home first, then buckets list/detail/settings, then events/users/admins), defined by `makefiles/local/e2e-spec-order-web.txt` and `makefiles/local/e2e-spec-order-management-web.txt`. The Makefile passes this order to the custom HTML reporter via `E2E_SPEC_ORDER`; the reporter reorders runs for display so the report matches the intended order. Playwright may still run spec files in its own order (e.g. alphabetical). When adding or removing E2E specs, update the appropriate order file so the full report stays logically grouped.
- **Specified runs** (`e2e_test_web_report_spec`, `e2e_test_management_web_report_spec`, `e2e_test_report_scoped`): When you pass one or more comma-separated paths in `SPEC`, `WEB_SPEC`, or `MGMT_SPEC`, the reporter reorders runs for display to match that parameter order; Playwright may run specs in a different order.

Stability mode is now the default for all E2E commands. Startup is usually slower than dev mode because app builds run before servers start, but this reduces dev-only overlay noise and false positives.

### Web Playwright: self-contained env (API, sidecar, Next)

The three web Playwright configs (`playwright.config.ts`, `playwright.signup-enabled.config.ts`, `playwright.admin-only-email.config.ts`) build **explicit env prefixes** from `apps/web/playwright.e2e-server-env.ts` so child processes do not depend on your shell, direnv, or local `sidecar/.env` for critical values.

- **API** uses the same test JWT as Vitest (`TEST_JWT_SECRET_API` from `@metaboost/helpers`) and sets **`API_CORS_ORIGINS=http://localhost:4012`** so credentialed browser requests from the E2E web origin are never blocked by an inherited restrictive allowlist (a common symptom was login staying on `/login` with no redirect).
- **Sidecar** receives every key required by `apps/web/sidecar/src/server.ts`, including **`API_SERVER_BASE_URL=http://127.0.0.1:4010`**, so SSR and server-side fetches target the Playwright API port instead of whatever might be in `sidecar/.env` (wrong port caused `ECONNREFUSED` / `fetch failed` in Next logs).
- **Admin-only-email** sidecar uses **`WEB_SIDECAR_PORT=4011`** (not `PORT`), matching what the sidecar server reads.

You do not need to tune local `sidecar/.env` for web E2E; the Playwright-started stack is intended to be self-contained.

### Management-web Playwright: self-contained env (API, sidecar, Next)

`apps/management-web/playwright.config.ts` builds **explicit env prefixes** from `apps/management-web/playwright.e2e-server-env.ts` so the stack does not depend on empty `RUNTIME_CONFIG_URL` or local `apps/management-web/sidecar/.env` (the app root layout requires a runtime-config sidecar when `RUNTIME_CONFIG_URL` is set—same pattern as web).

- **Sidecar** listens on **`4111`** (`MANAGEMENT_WEB_SIDECAR_PORT`) and receives every key required by `apps/management-web/sidecar/src/server.ts`, including **`MANAGEMENT_API_SERVER_BASE_URL=http://127.0.0.1:4110`** for SSR fetches. **`NEXT_PUBLIC_MANAGEMENT_API_PUBLIC_BASE_URL`** must be a full **`http://` or `https://` URL** (sidecar startup uses `validateHttpOrHttpsUrl`); E2E sets **`http://localhost:4110`** so the browser calls the Playwright management-api origin directly (CORS allows `http://localhost:4112`).
- **Next** uses **`RUNTIME_CONFIG_URL=http://localhost:4111`** during `build` and `start`.
- **Management-api** sets **`MANAGEMENT_API_CORS_ORIGINS=http://localhost:4112`** so credentialed browser requests from the E2E management-web origin are allowed (aligned with web E2E CORS).

## E2E and AUTH_MODE (mode-specific runs)

The **default** E2E run uses `AUTH_MODE=admin_only_username` (signup disabled, email flows disabled). The default Playwright config sets this (and the rest of the API/sidecar/web env) via `playwright.e2e-server-env.ts` so baseline runs are deterministic and do not depend on repo `.env` or ambient overrides.

Tests that depend on critical env (`AUTH_MODE`) use **separate specs and reports** so each mode is tested with single-outcome expectations (no dual-outcome tests).

Mode-specific auth commands:

- `make e2e_test_web` for default `admin_only_username` behavior.
- `make e2e_test_web_admin_only_email` for `admin_only_email` behavior.
- `make e2e_test_web_signup_enabled` for `user_signup_email` behavior.

### Signup-enabled E2E

**Full E2E targets include the signup-enabled path:** `e2e_test_report`, `e2e_test`, and `e2e_test_web` run the signup-enabled spec (after default web, where applicable). Mailpit is started automatically during those targets when the signup-enabled phase runs. **`make test_deps`** also starts Mailpit so a single prep step fully prepares for `make e2e_test_report` (and for `e2e_test` / `e2e_test_web`).

To run **only** the signup-enabled auth specs with a dedicated report:

- **Command:** `make e2e_test_web_signup_enabled`
- **When to use:** To verify signup plus verification-related auth pages in signup-enabled mode: duplicate-email handling and successful signup redirect, forgot-password success flow messaging, and reset-password invalid-link behavior when verification endpoints are enabled.
- **Mailpit:** Mailpit is defined in `infra/docker/e2e/docker-compose.yml` (SMTP 1025, web UI 8025). The target depends on `e2e_mailpit_up`, which runs `docker compose up -d` for that file. You can run `make e2e_mailpit_up` manually first if needed; otherwise the signup-enabled target starts it. **`make test_clean`** stops and removes the E2E Mailpit stack along with Postgres and Valkey, so no lingering containers. Env vars used by the API for signup-enabled E2E are documented in `infra/docker/e2e/.env.example`.
- **Report location:** `.artifacts/e2e-reports/<datetime>/web-signup-enabled/` (same timestamped run dir and rotation as other report targets).

Signup-enabled runs use `apps/web/playwright.signup-enabled.config.ts` with these specs:

- `e2e/signup-unauthenticated-signup-enabled.spec.ts`
- `e2e/forgot-password-unauthenticated-signup-enabled.spec.ts`
- `e2e/reset-password-unauthenticated-signup-enabled.spec.ts`

These specs are intentionally not included in the default web spec order (`e2e-spec-order-web.txt`).

### Admin-only-email E2E

To run admin-only-email auth coverage with a dedicated report:

- **Command:** `make e2e_test_web_admin_only_email`
- **When to use:** To verify auth behavior in `AUTH_MODE=admin_only_email`:
  - signup link hidden on login
  - forgot-password link visible and functional
  - `/signup` unavailable
  - forgot/reset routes available
  - set-password invitation form requires email + username + password fields.
- **Report location:** `.artifacts/e2e-reports/<datetime>/web-admin-only-email/`.

Admin-only-email runs use `apps/web/playwright.admin-only-email.config.ts` with ordered specs listed in `makefiles/local/e2e-spec-order-web-admin-only-email.txt`.

## Auth E2E coverage

Which auth pages exist and which E2E specs cover them. Use this when adding or changing auth flows so coverage stays explicit.

### Web app

| Page / route                           | Purpose                                        | E2E coverage                                                                                                                                                                                                                                                                               |
| -------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/login`                               | Login form                                     | Baseline: `login-unauthenticated`, `login-bucket-owner`. Admin-only-email: `login-unauthenticated-admin-only-email`. Signup-enabled: `login-unauthenticated-signup-enabled`.                                                                                                               |
| `/signup`                              | Signup form                                    | Baseline: redirect in admin_only_username (`signup-unauthenticated`). Dedicated specs for admin-only-email and signup-enabled.                                                                                                                                                             |
| `/forgot-password`                     | Request reset (email form)                     | Baseline: redirect when disabled (`forgot-password-unauthenticated`). Admin-only-email: form + success (`forgot-password-unauthenticated-admin-only-email`). Signup-enabled: dedicated spec.                                                                                               |
| `/reset-password?token=...`            | Reset password with token                      | Baseline: redirect when disabled (`reset-password-unauthenticated`). Admin-only-email: form, invalid token, **valid token → login → revert** (`reset-password-unauthenticated-admin-only-email`). Signup-enabled: same valid-token flow (`reset-password-unauthenticated-signup-enabled`). |
| `/auth/set-password?token=...`         | Set password (invite completion)               | Baseline and mode-specific specs: form, invalid token, valid token → login.                                                                                                                                                                                                                |
| `/auth/verify-email?token=...`         | Verify email (token from signup email)         | Baseline: redirect when email flows disabled (`verify-email-unauthenticated`). Admin-only-email: no token / invalid token → error; valid token → home (`verify-email-admin-only-email`). Only accessible when email verification flows are enabled.                                        |
| `/auth/confirm-email-change?token=...` | Confirm email change (token from email)        | Baseline: redirect when email flows disabled (`confirm-email-change-unauthenticated`). Admin-only-email: no token / invalid token → error; valid token → redirect (`confirm-email-change-admin-only-email`). Only accessible when email verification flows are enabled.                    |
| `/invite/[token]`                      | Invite accept/reject + login                   | `invite-unauthenticated`, `invite-non-admin`, `invite-bucket-owner`, `invite-bucket-admin`.                                                                                                                                                                                                |
| Settings (profile/password/email tabs) | Profile, change password, request email change | `settings-bucket-owner` (profile, password, no email tab in baseline). `settings-bucket-owner-admin-only-email` (email tab, request change → "verification email sent").                                                                                                                   |

API integration tests for verify-email and confirm-email-change remain in `apps/api/src/test/auth-mailer.test.ts`.

### Management-web

Management-web has a single auth surface: **login** (username + password). No signup, forgot-password, reset-password, or set-password. Covered by `login-unauthenticated` and `login-super-admin-full-crud`.

## Quick start: single home smoke test

Use this to bootstrap the E2E toolchain with one simple test per app.

1. `make e2e_deps`
2. Run one of (use `SPEC=`, `WEB_SPEC=`, and `MGMT_SPEC=` to run a subset of specs; for home smoke use `e2e/home.spec.ts`):
   - `make e2e_test_web_report_spec SPEC=e2e/<web-spec>.spec.ts` (e.g. `SPEC=e2e/home.spec.ts` for web home smoke)
   - `make e2e_test_management_web_report_spec SPEC=e2e/<management-spec>.spec.ts` (e.g. `SPEC=e2e/home.spec.ts` for management-web home smoke)
   - `make e2e_test_report_scoped WEB_SPEC=e2e/<web-spec>.spec.ts MGMT_SPEC=e2e/<management-spec>.spec.ts` (e.g. both home: `WEB_SPEC=e2e/home.spec.ts MGMT_SPEC=e2e/home.spec.ts`)
   - `make e2e_test_report` (full E2E suite for both apps + step screenshots + open HTML reports)
3. Cleanup:
   - `make e2e_teardown`
   - `make test_clean` (full dependency container cleanup)

Home smoke uses isolated E2E-only app ports:

- Web stack: API (`4010`), sidecar (`4011`), web (`4012`)
- Management stack: management-api (`4110`), management-web (`4112`)

These do not use the normal dev ports (`4000/4001/4002` and `4100/4101/4102`), so running dev apps will not conflict with E2E home smoke.

Nix wrapper variants:

- `./scripts/nix/with-env make e2e_deps`
- `./scripts/nix/with-env make e2e_test_web_report_spec SPEC=e2e/<web-spec>.spec.ts`
- `./scripts/nix/with-env make e2e_test_management_web_report_spec SPEC=e2e/<management-spec>.spec.ts`
- `./scripts/nix/with-env make e2e_test_report_scoped WEB_SPEC=e2e/<web-spec>.spec.ts MGMT_SPEC=e2e/<management-spec>.spec.ts`
- `./scripts/nix/with-env make E2E_API_GATE_MODE=on e2e_test_web_report_spec SPEC=e2e/<web-spec>.spec.ts`
- `./scripts/nix/with-env make E2E_API_GATE_MODE=on e2e_test_management_web_report_spec SPEC=e2e/<management-spec>.spec.ts`
- `./scripts/nix/with-env make e2e_teardown`
- `./scripts/nix/with-env make test_clean`

### Timestamped HTML report output

`make e2e_test_report_scoped WEB_SPEC=e2e/home.spec.ts MGMT_SPEC=e2e/home.spec.ts` (and other report targets) write report bundles to:

- `.artifacts/e2e-reports/<datetime>/web/`
- `.artifacts/e2e-reports/<datetime>/management-web/`

Full report (`make e2e_test_report`) also writes:

- `.artifacts/e2e-reports/<datetime>/web-signup-enabled/`

Standalone signup-enabled report target (`make e2e_test_web_signup_enabled`) writes to the same `web-signup-enabled/` path.

Where `<datetime>` is `YYYYMMDD-HHmmss` (for example `20260306-231045`).

It also updates:

- `.artifacts/e2e-reports/latest` (symlink to the latest timestamped run directory)

Retention policy for report directories:

- Keep at most 10 timestamped run directories under `.artifacts/e2e-reports/`.
- On each report run (e.g. `e2e_test_report_scoped`, `e2e_test_report`, `e2e_test_web_report_spec`), oldest timestamped directories are automatically removed when count exceeds 10.
- The `latest` symlink is always updated to the newest run and is not part of the rotation count.

These artifacts are git-ignored (`.artifacts/e2e-reports/`) and should not be committed.

### Step screenshot policy (report mode vs normal mode)

- Report targets (`e2e_test_web_report_spec`, `e2e_test_management_web_report_spec`, `e2e_test_report_scoped`, `e2e_test_report`) enable `E2E_STEP_SCREENSHOTS=true`, which captures:
  - initial page-load screenshots
  - post-action screenshots for user-visible steps (e.g. fill, click, navigation)
- Screenshots are stored in each test's Playwright output directory and attached to the HTML report for in-context review.
- Normal targets (`e2e_test_web`, `e2e_test_management_web`, `e2e_test`, etc.) do **not** enable this toggle, so runs stay lightweight by default.
- Screenshot filenames should be deliberately long and human-readable so QA can
  infer the expected visible state from the filename alone.

### Step report layout (custom reporter)

Report targets use a custom Playwright reporter
(`scripts/e2e-html-steps-reporter.ts`) instead of the built-in HTML reporter. The
generated report shows each step screenshot with its full **Step description**
directly below it in an expandable block, so you can match descriptions to
screenshots without a separate Attachments section. The reporter reads
`PLAYWRIGHT_HTML_OUTPUT_DIR` for the output folder (same as the Make target).
If the run is aborted (e.g. Ctrl+C), the generated report is partial and shows a
notice at the top: "Run aborted during execution; this report is incomplete."

## Deterministic data

- Seed scripts live in `tools/web/` (web E2E) and `tools/management-web/`
  (management-web E2E).
- E2E must not rely on faker without a fixed seed; use dedicated E2E seed
  scripts plus helper-created fixtures with deterministic names/IDs when the
  default seed is insufficient.
- Same rows and IDs every run so assertions remain stable.

### Current canonical seed contents

#### Web seed

- Four users (context slugs: bucket-owner, bucket-admin, admin-without-permission, non-admin):
  - bucket-owner: email `e2e-bucket-owner@example.com`, password `Test!1Aa`, display name `E2E Bucket Owner`
  - bucket-admin: email `e2e-bucket-admin@example.com`, password `Test!1Aa`, display name `E2E Bucket Admin`
  - admin-without-permission: email `e2e-admin-without-permission@example.com`, password `Test!1Aa`, display name `E2E Admin Without Permission`
  - non-admin: email `e2e-non-admin@example.com`, password `Test!1Aa`, display name `E2E Non Admin`
- Two top-level buckets:
  - `E2E Bucket One` (`isPublic: true`)
  - `E2E Bucket Two` (`isPublic: false`)
- No child bucket is created by default.

#### Management-web seed

- One management super admin:
  - username: `e2e-superadmin`
  - password: `Test!1Aa`
  - display name: `E2E Super Admin`
- No scoped/non-super-admin fixtures are created by default.
- No extra permission-matrix admins or prebuilt `event_visibility` variants are
  created by default.

### Fixture policy

- Prefer default seeded rows for read-only happy-path assertions.
- Use helper-created fixtures for:
  - child-bucket scenarios
  - scoped admin / permission-matrix scenarios
  - extra bucket admins or custom bucket roles
  - destructive specs that would otherwise mutate shared seed rows
- If a spec creates mutable data, use a unique naming pattern per test and do
  not leave later specs dependent on prior mutations.

### Token and one-time-link policy

- Do not seed invite tokens, reset-password tokens, or other one-time tokens.
- Obtain them via setup helpers, captured mail/test output, or deterministic
  test-only creation flows.
- Specs and plans should document the exact acquisition method instead of saying
  “via seed or API” ambiguously.

## Ports

| Service              | Port |
| -------------------- | ---- |
| Test Postgres        | 5532 |
| Test Valkey          | 6479 |
| API (E2E web)        | 4010 |
| Sidecar (E2E web)    | 4011 |
| Web (E2E)            | 4012 |
| Management-api (E2E) | 4110 |
| Management-web (E2E) | 4112 |

See [docs/development/ENV-REFERENCE.md](../development/ENV-REFERENCE.md) and `infra/env/classification/base.yaml` workloads `web`, `web-sidecar`, `management-web`, and `management-web-sidecar` for `RUNTIME_CONFIG_URL` and `NEXT_PUBLIC_*` defaults.

## Where specs live

- **Web**: `apps/web/e2e/` (or `apps/web/tests/e2e/`) — Playwright config and specs.
- **Management-web**: `apps/management-web/e2e/` (or `apps/management-web/tests/e2e/`).
- Shared, non–app-specific logic can live in `tools/` (e.g. `tools/e2e/`).

Do not run API tests and E2E concurrently against the same DB; run one or the other,
or use separate DB names for E2E if you prefer isolation.

## Reporting and visual review

Recommended open-source workflow is Playwright native reporting + artifacts:

- Use Playwright HTML report for human-readable pass/fail test summaries.
- Use Trace Viewer for step-level context when debugging failures.
- Use report-mode step screenshots when QA needs full visual walk-throughs.
- Retain screenshots/videos for failed tests in normal runs.

Recommended Playwright settings (both web and management-web configs):

- `reporter: [['list'], ['html', { open: 'never' }]]`
- `trace: 'retain-on-failure'`
- `screenshot: 'only-on-failure'`
- `video: 'retain-on-failure'`

### Full-suite report-mode guidance

- Built-in report-focused Make commands:
  - Feature-scoped defaults:
    - `make e2e_test_web_report_spec SPEC=e2e/<web-spec>.spec.ts`
    - `make e2e_test_management_web_report_spec SPEC=e2e/<management-spec>.spec.ts`
    - `make e2e_test_report_scoped WEB_SPEC=e2e/<web-spec>.spec.ts MGMT_SPEC=e2e/<management-spec>.spec.ts`
  - Broader regression checks:
    - `make e2e_test_report_scoped WEB_SPEC=e2e/home.spec.ts MGMT_SPEC=e2e/home.spec.ts` (home smoke)
    - `make e2e_test_report` (full E2E suite)
- Prefer scoped report commands for day-to-day feature work so reports contain only relevant scenarios and screenshots.
- Use full-suite report mode only when changes are broad, cross-cutting, or near release/deployment validation.
- Future route-cluster or other report-focused commands should follow the
  same model:
  - set `E2E_STEP_SCREENSHOTS=true`
  - write reports under `.artifacts/e2e-reports/<datetime>/<app>/`
  - keep traces/screenshots attached inside the Playwright report context
  - rely on `.artifacts/e2e-reports/latest` for the newest run
  - preserve the 10-run rotation policy
- When running a single page or route cluster in report mode, keep the artifact
  layout consistent with the same timestamped bundle structure so QA can review
  small-scope and full-suite runs the same way.

Reviewer flow:

1. Run `make e2e_test_report_scoped WEB_SPEC=... MGMT_SPEC=...` or `make e2e_test_report` (or another report-focused command that sets `E2E_STEP_SCREENSHOTS=true` and writes to the same timestamped report layout).
2. Open the app-specific HTML report (auto-open is attempted by the command).
3. Inspect each test's attachments for ordered step screenshots.
4. Use trace + failure artifacts for debugging when needed.
5. Verify screenshot content matches expected layout/values/behavior notes from
   the corresponding page test plan.

## Management auth note

- Management-web login uses `username`, not email.
- Management E2E setup, helpers, and page plans should always call this out
  explicitly so auth coverage uses the correct identifier field.

## Mutation/isolation rules

- Prefer seeded rows for read-only specs.
- Create/update/delete specs should use helper-created fixtures or a reseed
  boundary, not mutate shared seed rows that later specs require.
- If a destructive flow must touch a seeded row, document the cleanup or reseed
  boundary in the spec/plan before implementation.

Optional later enhancement: add Allure only if cross-run historical dashboards
are needed beyond Playwright's default report UX.
