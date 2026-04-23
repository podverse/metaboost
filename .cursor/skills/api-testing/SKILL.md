---
name: api-testing
description: When changing API routes, auth, or env-dependent behavior, add or update the corresponding integration tests and keep the test file layout consistent.
---

# API Integration Testing (Metaboost)

Testing requirement policy lives in **feature-implementation-testing**. This skill focuses on **how** to add or update API integration tests. If an API change affects behavior in `apps/web` or `apps/management-web`, also update the corresponding E2E specs (see e2e-page-tests).

Use this skill when adding or changing auth endpoints, versioned routes, or any API behavior that depends on environment variables. Keep tests in sync and use the correct test file and base URL.

## Test file layout

| File                                       | Scope                                                                                                                                     | When to update                                                                                                           |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `apps/api/src/test/auth.test.ts`           | **Shared** – endpoints unaffected by mailer mode: versioned root (GET /health, GET /), login, logout, me, change-password                 | Add tests for new shared auth or versioned routes; add validation/error cases for these endpoints.                       |
| `apps/api/src/test/auth-no-mailer.test.ts` | **No-mailer (admin-only)** – signup → 403, all verification routes → 403                                                                  | Change when no-mailer behavior or verification route list changes.                                                       |
| `apps/api/src/test/auth-mailer.test.ts`    | **Mailer-enabled (mocked)** – signup, verify-email, forgot/reset-password, request/confirm-email-change; uses `vi.mock` to capture tokens | Change when verification flows or mailer-dependent behavior changes; add validation tests (400/401) for these endpoints. |

- **Base URL**: Use `config.apiVersionPath` (from `../config/index.js`), never hardcode `/v1`. Example: `const API = config.apiVersionPath;` then `request(app).get(\`${API}/health\`)`.
- **Naming**: Mode-specific tests live in files with consistent names: `auth-no-mailer.test.ts`, `auth-mailer.test.ts`. If you add another mode (e.g. invite-only), add `auth-<mode>.test.ts` and document it in file headers and AGENTS.md.

## Clean slate and requirements

- **Clean slate**: Each test run truncates app tables once via Vitest `globalSetup` (`apps/api/src/test/global-setup.mjs`). No manual DB wipe needed between runs.
- **Test data unique per file**: Use a file-unique prefix (e.g. `const FILE_PREFIX = 'auth-shared';`) for all emails, usernames, and other identifiers that create DB rows, so tests can run in parallel (e.g. `maxWorkers: 2`) without collisions. The same rules (file-unique prefix, schema length limits, afterAll guards) apply to management-api integration tests in `apps/management-api/src/test/`.
- **Respect schema length limits**: DB columns have max lengths (e.g. `user_credentials.username` is VARCHAR(50) per `infra/k8s/base/db/postgres-init/0003_app_schema.sql`; see also `USERNAME_MAX_LENGTH` / `SHORT_TEXT_MAX_LENGTH` in `@metaboost/helpers`). When building file-unique identifiers (prefix + suffix + `Date.now()`), ensure the full string does not exceed the column limit — e.g. username ≤ 50 chars, so keep FILE_PREFIX short or use short suffixes for usernames. For management-api tests, `management_user_credentials.username` and `management_user_bio.display_name` are VARCHAR(50) (varchar_short in `infra/k8s/base/db/postgres-init/0005_management_schema.sql.frag`). When building file-unique admin usernames (e.g. email-style `prefix-suffix-${Date.now()}@example.com`), ensure the full string is ≤ 50 characters — use a short FILE_PREFIX (e.g. `mgmt-ap`, `mgmt-up`) or short suffixes.
- **afterAll cleanup**: In describe blocks that create resources in beforeAll and delete them in afterAll, guard the delete so it only runs when the created id is defined (e.g. `if (adminId !== undefined) await agent.delete(...)`). Otherwise a failed beforeAll leaves the id undefined and delete requests with id `"undefined"` cause unhandled rejections and hook timeouts.
- **Rate limiting in tests**: Rate limiting is **disabled in test** (very high limit in `packages/helpers-backend-api` rateLimit.ts) so integration tests never hit 429. **Do not add tests that assert rate-limit behavior** (e.g. 429 after N requests); they are a chronic source of flakiness and load-order issues.
- **Signup strict-limit test mode**: For `POST /auth/signup` strict-limit assertions, force signup-enabled mode in the test setup (`MAILER_ENABLED=true` and `AUTH_MODE` not `admin_only`) so assertions are not masked by admin-only/no-mailer `403` responses. Keep this setup before the dynamic app import.
- **Requirements**: Before tests, Postgres and Valkey must be up and the test DB created. Root `npm run test` runs `scripts/check-test-requirements.mjs` first; if ports are unreachable, it exits with instructions. From repo root: `make test_deps` (note underscore) starts test containers (Postgres **5632**, Valkey **6579** — Metaboost dev Docker uses 5532/6479), creates `metaboost_app_test`, applies schema, and grants read/read_write (including TRUNCATE for globalSetup). Make targets use **underscores**: `test_deps`, `help_test`, `test_clean`. After `apps/api` and `apps/management-api`, the same root command runs Vitest in **metaboost-signing** and **@metaboost/rss-parser**.

## What to update when the API changes

1. **New versioned or shared auth route**  
   Add tests in `auth.test.ts` (happy path and validation/error cases as appropriate).

2. **New or changed verification or mailer-dependent route**  
   Add or update tests in `auth-mailer.test.ts` (with mailer mocked). Add corresponding 403 tests in `auth-no-mailer.test.ts` for the same path.

3. **New env mode (e.g. AUTH_MODE or new feature flag)**  
   Add a new test file `auth-<mode>.test.ts` with a clear top-level describe (e.g. `auth-invite-only (mocked)`), set the env in that file, and document in its header and in AGENTS.md.

4. **Schema/ORM change**  
   Ensure entity column names match the DB (e.g. `@PrimaryColumn('uuid', { name: 'user_id' })` for `UserCredentials` and `UserBio`). Otherwise integration tests will fail with “column does not exist” (TypeORM uses property name by default).

5. **New app table that should be cleared between runs**  
   Update `global-setup.mjs`: either extend the single `TRUNCATE "user" ... CASCADE` if the new table references `user`, or add an explicit `TRUNCATE` for the new table.

## Quick reference

- **Default execution strategy (agent/sandbox):** start with the leanest targeted integration test command that verifies the change (for example a single test file), then expand scope only if needed.
- Run tests: `npm run test:e2e:api` from repo root for API integration tests only (or `./scripts/nix/with-env npm run test:e2e:api` in Nix/agent). First step is the requirements check, then Vitest runs for `apps/api` and `apps/management-api`. For unit-only (no DB needed): `npm run test:unit`. Full suite: `npm test`.
- Run one API integration test file (preferred during iteration): `./scripts/nix/with-env npm run test -w apps/api -- src/test/<file>.test.ts`
- Test env: `apps/api/src/test/setup.ts` sets defaults (DB_PORT 5632, VALKEY_PORT 6579, DB_APP_NAME metaboost_app_test, etc.). globalSetup uses the same defaults so it can run without setupFiles.
- Mailer in tests: No real SMTP. `auth-mailer.test.ts` sets `MAILER_ENABLED=true` and mocks `../lib/mailer/send.js` to capture tokens for verify-email, reset-password, and confirm-email-change.
