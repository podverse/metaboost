# Test Setup (Integration and E2E)

How to run unit/integration tests and E2E tests, what they depend on, and where route coverage lives.

## Port allocation (local host)

Test infrastructure uses **different** host ports than Metaboost **dev** Docker (`make local_infra_up`) so you can run `make test_deps` while `metaboost_local_postgres` / `metaboost_local_valkey` stay up. Podverse local stacks use **5432** / **6379**; Metaboost avoids those for both dev and test.

| Role                                                                          | Postgres (host) | Valkey (host) |
| ----------------------------------------------------------------------------- | --------------- | ------------- |
| Podverse local                                                                | 5432            | 6379          |
| Metaboost local dev (`infra/docker/local`, `metaboost_local_*`)               | 5532            | 6479          |
| Metaboost test (`make test_deps`, `npm run test`, E2E seeds against test DBs) | **5632**        | **6579**      |

Override test bind ports with `TEST_DB_PORT` / `TEST_KEYVALDB_PORT` in the Makefile, and set `DB_PORT` / `KEYVALDB_PORT` for Node so they match.

## Prerequisites

- **Postgres** and **Valkey** reachable at test ports (defaults **5632**, **6579**).
- **One-time setup:** From repo root run `make test_deps` to start Postgres and Valkey, create test DBs (`metaboost_app_test`, `metaboost_management_test`), and (for E2E) start Mailpit. See `make help_test` for instructions.
- **Nix users:** Use `./scripts/nix/with-env <command>` from repo root so Node/npm and tools are available.

## Integration tests (API and management-api)

- **Run all:** From repo root: `npm run test` (runs Vitest for `apps/api`, `apps/management-api`, then `metaboost-signing` and `@metaboost/rss-parser`).
- **Single file:** `./scripts/nix/with-env npx vitest run apps/api/src/test/buckets.test.ts` (or the path to any `*.test.ts`).
- **Env:** Tests use smart defaults from [apps/api/src/test/setup.ts](apps/api/src/test/setup.ts). Tests that need signup/mailer override env at the top of the file and load app/config in `beforeAll`. No local mailer required for most tests; verification flows use a Vitest mock.
- **Clean slate:** globalSetup truncates main and management tables once before any test file runs (api: [apps/api/src/test/global-setup.mjs](../../apps/api/src/test/global-setup.mjs); management-api: [apps/management-api/src/test/global-setup.mjs](../../apps/management-api/src/test/global-setup.mjs)).

### Route → test file (API)

| Area                     | Test file(s)                                                                           |
| ------------------------ | -------------------------------------------------------------------------------------- |
| Auth                     | `auth.test.ts`, `auth-no-mailer.test.ts`, `auth-mailer.test.ts`, `root-routes.test.ts` |
| Buckets CRUD             | `buckets.test.ts`                                                                      |
| Bucket admins            | `bucket-admins.test.ts`                                                                |
| Bucket admin invitations | (invitation flows covered via auth/invite tests)                                       |
| Bucket roles             | (covered via management-api or E2E)                                                    |

### Route → test file (management-api)

| Area                                 | Test file(s)                                                                                                                           |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Auth, users, buckets, events, admins | `management-api.test.ts`, `management-users-*.test.ts`, `management-buckets-messages.test.ts`, `management-admins-permissions.test.ts` |

## E2E tests (web and management-web)

- **Make targets:** Use `make` from repo root so dependencies and seed are handled. Do not run Playwright directly for normal verification.
- **Web (one or more specs):** `make e2e_test_web_report_spec SPEC=e2e/<spec>.spec.ts` (or comma-separated list).
- **Management-web:** `make e2e_test_management_web_report_spec SPEC=e2e/<spec>.spec.ts`.
- **Scoped (web + management-web):** `make e2e_test_report_scoped WEB_SPEC=... MGMT_SPEC=...`.
- **API gate:** By default (`E2E_API_GATE_MODE=off`) API integration tests are **not** run before E2E. To run them, pass `E2E_API_GATE_MODE=on` (e.g. `make E2E_API_GATE_MODE=on e2e_test_web_report_spec SPEC=...`).
- **Full details:** [E2E-PAGE-TESTING.md](E2E-PAGE-TESTING.md), [E2E-SPEC-REPORT-COMMANDS.md](E2E-SPEC-REPORT-COMMANDS.md).

### E2E seed safety

- Deterministic E2E seed entrypoints are `tools/web/seed-e2e.mjs` and
  `tools/management-web/seed-e2e.mjs`.
- `tools/generate-data` remains a separate local QA/exploration generator and must not be used
  as a dependency for `make e2e_seed*` targets.

## Reference

- **AGENTS.md** § Testing — test databases, globalSetup, mailer, and high-level commands.
- **make help_test** — Prints how to satisfy test requirements (Postgres, Valkey, test DBs).
