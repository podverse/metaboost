# AI Development Guide – Metaboost

Quick reference for AI assistants working on the Metaboost repo (HTTP API + Next.js app).

Authoritative AI rules: **`.cursor/`**, **`.cursorrules`**. **Machine-generated** exports: [`.llm/exports/`](.llm/exports/) (produced and published by **`llm-exports-sync`** / **`llm-exports-full`**; not by default local `npm` runs). `LLM_EXPORT_ALLOW_LOCAL=1` is only for [scripts/llm/](scripts/llm/) development; see [docs/development/llm/DOCS-DEVELOPMENT-LLM.md](docs/development/llm/DOCS-DEVELOPMENT-LLM.md) and [`llm-cursor-source`](.cursor/skills/llm-cursor-source/SKILL.md). Non-Cursor: use exports first, then [docs/development/llm/LLM-EDITOR-ALIGNMENT-PROMPT.md](docs/development/llm/LLM-EDITOR-ALIGNMENT-PROMPT.md) if needed. Policy and `gh` setup: [docs/development/llm/DOCS-DEVELOPMENT-LLM.md](docs/development/llm/DOCS-DEVELOPMENT-LLM.md), [docs/development/llm/GH-EXPORTS-SETUP.md](docs/development/llm/GH-EXPORTS-SETUP.md).

## Stack

- Node.js 24+ (see `.nvmrc`)
- npm workspaces: `apps/api`, `apps/web`, `apps/web/sidecar`
- TypeScript strict, ESM

## Commands

```bash
npm install
npm run build
npm run lint
npm run dev:api          # API only (default port 4000)
npm run dev:web          # Next.js only
npm run dev:web-sidecar  # Build sidecar + run web with sidecar
```

### Nix / terminal (agent sandbox)

Node and npm are provided by the repo's Nix flake, not a global install. When running terminal commands (e.g. in Cursor's agent), use the wrapper so the correct environment is available:

- **Wrapper:** `./scripts/nix/with-env <command> [args...]`
- **Examples:** `./scripts/nix/with-env npm run build`, `./scripts/nix/with-env npm run dev:api`
- Run from repo root. Full explanation and setup-in-other-repos: [docs/CURSOR-NIX-WITH-ENV.md](docs/CURSOR-NIX-WITH-ENV.md).
- Agent runs that use the wrapper may need full permissions so Nix can write to its cache.

## Structure

- `apps/api/` – Standalone Express HTTP API
- `apps/web/` – Next.js app (fetches runtime config from sidecar when `RUNTIME_CONFIG_URL` is set)
- `apps/web/sidecar/` – Runtime-config sidecar (serves env-derived config for the Next.js app)
- `packages/ui/` – Shared UI: design tokens and mixins in `packages/ui/src/styles/` (variables, mixins); component groups (form, layout, modal, navigation, table, feedback, bucket) and hooks (useDeleteModal, useTableFilterState, useAuthValidation) documented in [packages/ui/PACKAGES-UI.md](packages/ui/PACKAGES-UI.md). Form controls live under `packages/ui/src/components/form/` (see that directory’s PACKAGES-UI-SRC-COMPONENTS-FORM.md).
- **Validation schemas:** Joi validation lives in `apps/api/src/schemas/` and `apps/management-api/src/schemas/`. Controllers and routes import from these directories only; no ad-hoc schema definitions in controllers or routes. Shared request/response types may live in `packages/helpers-requests` or `packages/helpers`. See each app’s `schemas/APPS-API-SRC-SCHEMAS.md` and `schemas/APPS-MANAGEMENT-API-SRC-SCHEMAS.md` for the file layout.

## Local env

Secrets (JWT, DB, Valkey, etc.) are **auto-generated** by `make local_env_setup` via
`scripts/env-setup-secrets.sh`. **Canonical contributor-facing env templates/examples** are **`apps/*/.env.example`**, **`apps/*/sidecar/.env.example`**, and **`infra/config/env-templates/*.env.example`** (see [docs/development/env/ENV-REFERENCE.md](docs/development/env/ENV-REFERENCE.md)). `scripts/local-env/setup.sh` generates app and `infra/config/local/*.env` files from those templates when missing. Optional override files under `dev/env-overrides/local/*.env` (symlinked from `~/.config/metaboost/local-env-overrides/` via prepare/link) are merged by **`setup.sh`** when present — **info.env**, **user-agent.env**, **db-management-superuser.env** (superuser credentials for **`create-super-admin.mjs`** when both username and password are set), **mailer.env**, **auth.env**, **locale.env** (see [docs/development/env/LOCAL-ENV-OVERRIDES.md](docs/development/env/LOCAL-ENV-OVERRIDES.md)). **`API_CORS_ORIGINS`** and **`MANAGEMENT_API_CORS_ORIGINS`** should match local web base URLs for local dev. **WEB_BASE_URL** / **WEB_URL** stay as local dev defaults in generated app env (not in home override stubs).

- **Prepare:** `make local_env_prepare` — ensures `~/.config/metaboost/local-env-overrides/` exists and creates missing override `.env` files with keys/defaults seeded from canonical `.env.example` templates (`write-home-override-stubs.rb`; never overwrites existing `KEY=` lines; appends missing keys with defaults); edit for non-default values
- **Link:** `make local_env_link` — symlinks `dev/env-overrides/local/*.env` to existing files in the home overrides directory
- **Clean:** `make local_env_clean` — removes generated repo env and **`dev/env-overrides/local/*.env`** symlinks; does **not** remove home files under `~/.config/metaboost/local-env-overrides/`. Run **`local_env_link`** before **`local_env_setup`** after a clean if you use home overrides.
- **Setup:** `make local_env_setup` — seed env files from canonical templates/examples, then apply auto-generated secrets and overrides (info, user-agent, db-management-superuser, mailer, auth, locale) when those override files exist (via repo paths under `dev/env-overrides/local/` after link).
- **One-shot:** `make local_setup` — `local_env_setup` + `local_infra_up`

See [docs/development/env/LOCAL-ENV-OVERRIDES.md](docs/development/env/LOCAL-ENV-OVERRIDES.md).

## LLM History

See [.llm/LLM.md](.llm/LLM.md) for full guidelines. Use the **llm-history** skill when updating history or starting feature work. The **llm-history-tracking** rule (always applied) requires updating `.llm/history/active/[feature]/` on any file-modifying response.

- Follow `.cursor/skills/llm-history/SKILL.md` for history timing, format, and 10-session limit.

## Security review

For PRs touching auth, CORS, outbound HTTP, redirects, SQL query builders, or proxy headers, use [docs/development/security/SECURITY-REVIEW-CHECKLIST.md](docs/development/security/SECURITY-REVIEW-CHECKLIST.md). Finding-level traceability lives in [docs/development/security/SECURITY-FINDINGS-CLOSURE-MATRIX.md](docs/development/security/SECURITY-FINDINGS-CLOSURE-MATRIX.md). Run **`npm run security:check`** locally (also part of **`make validate_ci`**).

## Testing

When implementing features or executing plans that touch **api** or **management-api**, include **integration tests** (see api-testing). When they touch **web** or **management-web**, include **E2E tests** (see e2e-page-tests). If an API change affects UI in web or management-web, add or update the relevant E2E specs as well.

### Root npm scripts

| Script                         | What it runs                                                                                                                             | Services needed                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `npm run test:unit`            | Vitest in `@metaboost/helpers`, `@metaboost/helpers-currency`, `@metaboost/helpers-valkey`, `metaboost-signing`, `@metaboost/rss-parser` | None (pure Node)                                      |
| `npm run test:e2e:api`         | `check-test-requirements` then Vitest in `apps/api` + `apps/management-api`                                                              | Postgres **5632**, Valkey **6579** (`make test_deps`) |
| `npm run test:e2e:web`         | `make e2e_test` (Playwright: web + management-web)                                                                                       | Full E2E stack (`make test_deps` + seeds)             |
| `npm run test:e2e:web:reports` | `make e2e_test_report` (HTML step-screenshot reports)                                                                                    | Same as `test:e2e:web`                                |
| `npm run test:reports`         | `test:unit` → `test:e2e:api` → `test:e2e:web:reports`                                                                                    | All tiers                                             |
| `npm test`                     | `test:unit` → `test:e2e:api` → `test:e2e:web`                                                                                            | All tiers (slow — runs locally, not in CI)            |

Full `npm test` including Playwright is intentionally **slow** and meant for **developer-local** runs. CI skips the full suite; maintainers run `make test_deps` and npm test targets locally before merge.

### API integration tests

One setup file ([apps/api/src/test/setup.ts](apps/api/src/test/setup.ts)) provides smart-default env for all tests. Tests that need different env (e.g. signup/mailer) override only those vars at the top of the file and load app/config via dynamic import in `beforeAll` so overrides apply. The **first step** is a requirements check: Postgres and Valkey must be reachable at the test ports (defaults **5632**, **6579** — distinct from Metaboost dev Docker on 5532/6479). If not, the script exits with instructions (e.g. `make test_deps`). In Nix/agent environments use `./scripts/nix/with-env npm run test:e2e:api`.

- **Test requirements (Makefile):** Test-related commands live in `makefiles/local/Makefile.local.test.mk`. From
  repo root: `make test_deps` starts Postgres on **5632** and Valkey on **6579**, creates **two** test databases:
  `metaboost_app_test` (main app; `infra/k8s/base/ops/source/database/linear-migrations/app/0001_app_schema.sql`) and `metaboost_management_test`
  (management-api; `infra/k8s/base/ops/source/database/linear-migrations/management/0001_management_schema.sql`), and creates app/management
  read and read_write roles (`metaboost_app_read` / `metaboost_app_read_write`, `metaboost_management_read` /
  `metaboost_management_read_write`). `make help_test` prints instructions.
- **Test databases:** Tests use dedicated DBs on the same Postgres instance. Main: `metaboost_app_test` (api and
  management-api main-user CRUD). Management: `metaboost_management_test` (management identities, permissions,
  events). Default test ports are **5632** (Postgres) and **6579** (Valkey). Each test run starts with a **clean slate**:
  globalSetup truncates main and management tables once before any test file runs (api: `apps/api/src/test/global-setup.mjs`;
  management-api: `apps/management-api/src/test/global-setup.mjs`).
- **Database naming (dev/Docker/K8s):** Two databases in one Postgres instance: app DB
  `metaboost_app`, management DB `metaboost_management`. Canonical env templates define `DB_APP_NAME` and `DB_MANAGEMENT_NAME`;
  cluster superuser is `DB_APP_ADMIN_USER` (default `user`) and `DB_APP_ADMIN_PASSWORD` in `db.env` (with
  `DB_HOST` / `DB_PORT` for clients). The official Postgres Docker image still reads `DB_APP_ADMIN_USER`, `DB_APP_ADMIN_PASSWORD`,
  `DB_APP_NAME`; local Compose maps them from `DB_APP_ADMIN_USER`, `DB_APP_ADMIN_PASSWORD`, and `DB_APP_NAME`. Apps use `DB_APP_NAME` (synced
  by `local_env_setup`). Management-api uses the same **`DB_HOST`** / **`DB_PORT`** plus **`DB_MANAGEMENT_NAME`** and
  **`DB_MANAGEMENT_READ_WRITE_*`** (inherited from env group **`db`**; no separate `MANAGEMENT_DB_*` vars).
  Role names: `metaboost_app_read` / `metaboost_app_read_write`, `metaboost_management_read` /
  `metaboost_management_read_write`; keys `DB_APP_READ_*` and `DB_MANAGEMENT_READ_*`.
- **Mailer:** No local mailer service is required. Tests that cover verification flows use a Vitest mock of the
  mailer module to capture tokens and call verification endpoints; see `apps/api/src/test/*.test.ts`.

## Auth and PII

- **Credentials:** The system stores only `passwordHash` (no plaintext password). Never return `passwordHash` or any credential field in API responses. Use `userToJson` (or a similar safe serializer) for user data; never serialize `req.user` or `user.credentials` directly.
- **Verification tokens:** Token hashes and raw tokens are never returned or listed by the API; they are only consumed server-side (verify-email, reset-password, confirm-email-change). Do not add endpoints that expose verification token entities.
- **User in responses:** For the **authenticated user only** (login, me, signup, refresh, confirm-email-change, update-profile), use `PublicUser` (id, idText, email, username, displayName) via `userToJson`. Email is PII and must not be returned for _other_ users. For any response that describes another user (e.g. bucket admins list/detail), use `PublicUserSummary` (id, idText, username, displayName) via `userToPublicSummary` from `apps/api/src/lib/userToJson.ts`.
- **API messages and locale:** API structural messages (e.g. "Invalid or expired link", "Authentication required") are American English. Password validation text and email content (verification, password reset, email-change) are localized: resolved from `Accept-Language` when the value is supported (en-US, es), else app default from `DEFAULT_LOCALE` env. Do not localize the `message` field for structural errors; user-facing content such as email subject/body and password validation messages is localized.

## Dependencies

- **Upgrade policy:** Apply **patch and minor** updates routinely (e.g. `npm outdated` then bump versions and `npm install`). **Major** upgrades (e.g. @faker-js/faker, dotenv, eslint-plugin-perfectionist, express-rate-limit, lint-staged, nanoid, @types/node) are done separately with migration and testing. After any dependency change, run `npm run build` and `npm run lint`; commit the updated `package-lock.json` so CI and Docker use the same versions.
- **Linux-canonical lockfile:** CI runs on Linux and needs Linux optional deps (e.g. `@parcel/watcher`, `@next/swc-linux-x64-gnu`, next-intl's `@swc/core`) in the lockfile. Generate or refresh the lockfile under Linux x64 so it stays correct for CI: run `./scripts/development/update-lockfile-linux.sh` (requires Docker). The bump-version script runs this automatically before committing. When you add or update dependencies from a Mac, run that script and commit the updated `package-lock.json`.

## Code Quality

- Strict equality (`===` / `!==` only)
- Avoid type assertions (`as`); prefer types and narrowing
- Semicolons in JS/TS

### Import order

Imports must follow a consistent hierarchy and be alphabetized within groups: (1) Node built-ins, (2) external packages, (3) workspace packages (`@metaboost/*`), (4) relative imports (parent, sibling, index), (5) style imports (SCSS/CSS) last. Type-only imports use a separate line (`import type { X } from '...'`) and are ordered with their group. Enforced by ESLint rule `perfectionist/sort-imports`; run `npm run lint:fix` to auto-fix.

## Skills and Rules

- **.cursor/skills/** – Project skills (one SKILL.md per directory). Use when the task matches the skill’s “when to use” so the agent follows the right patterns.
- **.cursor/rules/** – Glob-triggered or always-applied rules (e.g. eqeqeq, avoid-type-assertions, llm-history-tracking, path-casing). Rules apply automatically when editing matching files.

All configuration is project-scoped (no home-directory skills or rules).

### When to use which skill

| Task or area                | Skill(s) to use                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **LLM / exports (tooling)** | **llm-exports-scripts** when changing `scripts/llm/**` (export sync, adapters, vendor selector). **llm-cursor-source** for what to commit and `.llm/exports` automation policy.                                                                                                                                                                                                                                                          |
| **History / plans**         | **llm-history** when updating history or starting feature work. **plan-files-convention** when creating, saving, or completing multi-step plans (e.g. COPY-PASTA execution). **single-readme** when adding index/overview docs (repo has only one README at root). Plans live in `.llm/plans/active/`; split if over 300 lines (see **plan-creation** rule).                                                                             |
| **API**                     | **api** for Express API patterns. **api-testing** when adding or changing API routes, auth, or env-dependent behavior (integration tests). **swagger-openapi** when changing API surface. **api-no-pii-credentials** rule applies to responses. **Run:** `npm run test:e2e:api` (integration), `npm run test:unit` (packages only).                                                                                                      |
| **Web / management-web**    | **web** for Next.js app patterns. **e2e-page-tests** when layout or behavior changes in web/management-web. **response-ending-make-verify** (and **end-with-targeted-make-report-verify** rule) for E2E verification commands. Use **make** E2E targets only (**e2e-run-with-make-only**). **Run:** `make e2e_test_web`, `make e2e_test_report`.                                                                                         |
| **Testing (general)**       | **feature-implementation-testing** — tests are required for features touching api/management-api/web/management-web. **unit-tests-risk-first** for prioritizing unit tests. **unit-tests-confident-granularity** for test depth. **unit-tests-security-authz-template** for auth/permission tests. **Run:** `npm test` (full), `npm run test:unit` (no DB), `npm run test:e2e:api` (DB needed), `npm run test:reports` (full with HTML). |
| **i18n**                    | **i18n** when adding/editing translation keys, locales, or generating translations.                                                                                                                                                                                                                                                                                                                                                      |
| **Forms / UI**              | **use-form-component**, **button-loading-async**, **password-strength-on-set-update**. **avoid-type-assertions**, **eqeqeq-strict-equality** rules apply.                                                                                                                                                                                                                                                                                |
| **DB / ORM**                | **database-schema-naming**, **typeorm-orderby-property-names**, **generate-data-sync** when schema or entities change. **nested-resource-prefix-naming** for nested resources.                                                                                                                                                                                                                                                           |
| **K8s / Argo CD**           | **Remote cluster runbook:** [docs/development/k8s/REMOTE-K8S-GITOPS.md](docs/development/k8s/REMOTE-K8S-GITOPS.md). **argocd-gitops-push** when changing files under `infra/k8s/` or sync targets for k8s (add push-to-Git reminder in response so Argo CD can sync).                                                                                                                                                                    |
| **Env / templates**         | Keep env work anchored to canonical templates/examples (`scripts/local-env/setup.sh`, `scripts/env-overrides/prepare-home-env-overrides.sh`). For remote K8s, maintain env/manifests directly in your GitOps repository.                                                                                                                                                                                                                 |
| **Imports / paths**         | **path-casing-imports** when adding or changing relative imports (rule also applies on .ts/.tsx). **type-imports-separate-line** rule for type-only imports.                                                                                                                                                                                                                                                                             |

For **file-modifying work**: update `.llm/history/active/[feature]/` per **llm-history** and the **llm-history-tracking** rule. For **large or multi-step plans**: save under `.llm/plans/active/` and use **plan-files-convention**; execute via COPY-PASTA prompts one plan at a time.
