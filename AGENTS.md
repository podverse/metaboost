# AI Development Guide – Boilerplate

Quick reference for AI assistants working on the Boilerplate repo (HTTP API + Next.js app).

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

## Local env (aligned with Podverse)

Secrets (JWT, DB, Valkey, etc.) are **auto-generated** by `make local_env_setup` via
`scripts/env-setup-secrets.sh`. **Canonical variable names and defaults** live in **`infra/env/classification/`** (see [docs/development/ENV-REFERENCE.md](docs/development/ENV-REFERENCE.md)); `scripts/local-env/setup.sh` generates app and `infra/config/local/*.env` files via `scripts/env-classification/boilerplate-env.rb` when missing. Optional override files under `dev/env-overrides/local/*.env` (symlinked from `~/.config/boilerplate/local-env-overrides/` via prepare/link) are applied when present:
**info.env** (`WEB_BRAND_NAME` for web UI and for API transactional email when **`AUTH_MODE`** uses email flows; `MANAGEMENT_WEB_BRAND_NAME` for management-web UI), **user-agent.env** (`API_USER_AGENT`, `MANAGEMENT_API_USER_AGENT`; legacy `USER_AGENT_*` and prior **`MANAGEMENT_USER_AGENT`** are mapped in **`setup.sh`**), **db-management-superuser.env** (**`DB_MANAGEMENT_SUPERUSER_USERNAME`**, **`DB_MANAGEMENT_SUPERUSER_PASSWORD`** — copied into **`db.env`** and management-api env by **`setup.sh`** so **`create-super-admin.mjs`** can bootstrap the management super admin without a TTY when both are set), **mailer.env** (SMTP — no defaults; devs bring their own; tests use mailpit), **auth.env** (AUTH*MODE), **locale.env** (DEFAULT_LOCALE, SUPPORTED_LOCALES with sensible defaults). **`API_CORS_ORIGINS`** is **`api.vars`** (**`literal`**, aligned with **`http.web`** **`WEB_BASE_URL`** for local dev); **`MANAGEMENT_API_CORS_ORIGINS`** is **`management-api.vars`** (**`literal`**, aligned with **`http.management-web`** **`MANAGEMENT_WEB_BASE_URL`** for local dev; not home overrides; legacy \*\*`CORS_ORIGINS*\*`** and prior **`MANAGEMENT_CORS_ORIGINS`** are still mapped in **`setup.sh`**). **WEB_BASE_URL, WEB_URL\*\* stay as local dev defaults in generated app env (not in those override stubs).

- **Prepare:** `make local_env_prepare` — ensures `~/.config/boilerplate/local-env-overrides/` exists and creates missing override `.env` files with all anchor keys and merged classification defaults (`write-home-override-stubs.rb`; never overwrites existing files); edit for non-default values
- **Link:** `make local_env_link` — symlinks `dev/env-overrides/local/*.env` to existing files in the home overrides directory
- **Clean:** `make local_env_clean` — removes generated repo env and **`dev/env-overrides/local/*.env`** symlinks; does **not** remove home files under `~/.config/boilerplate/local-env-overrides/`. Run **`local_env_link`** before **`local_env_setup`** after a clean if you use home overrides.
- **Setup:** `make local_env_setup` — generate env files from classification, auto-generated secrets, and overrides (info, user-agent, db-management-superuser, mailer, auth, locale) when those override files exist (via repo paths under `dev/env-overrides/local/` after link).
- **One-shot:** `make local_setup` — `local_env_setup` + `local_infra_up`

See [docs/development/LOCAL-ENV-OVERRIDES.md](docs/development/LOCAL-ENV-OVERRIDES.md).

## LLM History

See [.llm/LLM.md](.llm/LLM.md) for full guidelines. Use the **llm-history** skill when updating history or starting feature work. The **llm-history-tracking** rule (always applied) requires updating `.llm/history/active/[feature]/` on any file-modifying response.

- Follow `.cursor/skills/llm-history/SKILL.md` for history timing, format, and 10-session limit.

## Testing

When implementing features or executing plans that touch **api** or **management-api**, include **integration tests** (see api-testing). When they touch **web** or **management-web**, include **E2E tests** (see e2e-page-tests). If an API change affects UI in web or management-web, add or update the relevant E2E specs as well.

- **API integration tests:** One setup file ([apps/api/src/test/setup.ts](apps/api/src/test/setup.ts)) provides smart-default env for all tests. Tests that need different env (e.g. signup/mailer) override only those vars at the top of the file and load app/config via dynamic import in `beforeAll` so overrides apply. Full coverage: `npm run test` from repo root. The **first step** is a requirements check: Postgres and Valkey must be reachable at the test ports (defaults 5532, 6479). If not, the script exits with instructions (e.g. `make test_deps`). In Nix/agent environments use `./scripts/nix/with-env npm run test`.
- **Test requirements (Makefile):** Test-related commands live in `makefiles/local/Makefile.local.test.mk`. From
  repo root: `make test_deps` starts Postgres on 5532 and Valkey on 6479, creates **two** test databases:
  `boilerplate_app_test` (main app; `infra/k8s/base/stack/postgres-init/0003_app_schema.sql`) and `boilerplate_management_test`
  (management-api; `infra/k8s/base/stack/postgres-init/0005_management_schema.sql.frag`), and creates app/management
  read and read_write roles (`boilerplate_app_read` / `boilerplate_app_read_write`, `boilerplate_management_read` /
  `boilerplate_management_read_write`). `make help_test` prints instructions.
- **Test databases:** Tests use dedicated DBs on the same Postgres instance. Main: `boilerplate_app_test` (api and
  management-api main-user CRUD). Management: `boilerplate_management_test` (management identities, permissions,
  events). Default test ports are **5532** (Postgres) and **6479** (Valkey). Each test run starts with a **clean slate**:
  globalSetup truncates main and management tables once before any test file runs (api: `apps/api/src/test/global-setup.mjs`;
  management-api: `apps/management-api/src/test/global-setup.mjs`).
- **Database naming (dev/Docker/K8s):** Two databases in one Postgres instance, aligned with Podverse: app DB
  `boilerplate_app`, management DB `boilerplate_management`. Classification defines `DB_APP_NAME` and `DB_MANAGEMENT_NAME`
  (via `db` env group keys); cluster superuser is `DB_USER` (default `user`) and `DB_PASSWORD` in `db.env` (with
  `DB_HOST` / `DB_PORT` for clients). The official Postgres Docker image still reads `POSTGRES_USER`, `POSTGRES_PASSWORD`,
  `POSTGRES_DB`; local Compose maps them from `DB_USER`, `DB_PASSWORD`, and `DB_APP_NAME`. Apps use `DB_APP_NAME` (synced
  by `local_env_setup`). Management-api uses the same **`DB_HOST`** / **`DB_PORT`** plus **`DB_MANAGEMENT_NAME`** and
  **`DB_MANAGEMENT_READ_WRITE_*`** (inherited from classification env group **`db`**; no separate `MANAGEMENT_DB_*` vars).
  Role names: `boilerplate_app_read` / `boilerplate_app_read_write`, `boilerplate_management_read` /
  `boilerplate_management_read_write`; keys `DB_APP_READ_*` and `DB_MANAGEMENT_READ_*`.
- **Mailer:** No local mailer service is required. Tests that cover verification flows use a Vitest mock of the
  mailer module to capture tokens and call verification endpoints; see `apps/api/src/test/*.test.ts`.

## Auth and PII

- **Credentials:** The system stores only `passwordHash` (no plaintext password). Never return `passwordHash` or any credential field in API responses. Use `userToJson` (or a similar safe serializer) for user data; never serialize `req.user` or `user.credentials` directly.
- **Verification tokens:** Token hashes and raw tokens are never returned or listed by the API; they are only consumed server-side (verify-email, reset-password, confirm-email-change). Do not add endpoints that expose verification token entities.
- **User in responses:** For the **authenticated user only** (login, me, signup, refresh, confirm-email-change, update-profile), use `PublicUser` (id, shortId, email, username, displayName) via `userToJson`. Email is PII and must not be returned for _other_ users. For any response that describes another user (e.g. bucket admins list/detail), use `PublicUserSummary` (id, shortId, username, displayName) via `userToPublicSummary` from `apps/api/src/lib/userToJson.ts`.
- **API messages and locale:** API structural messages (e.g. "Invalid or expired link", "Authentication required") are American English. Password validation text and email content (verification, password reset, email-change) are localized: resolved from `Accept-Language` when the value is supported (en-US, es), else app default from `DEFAULT_LOCALE` env. Do not localize the `message` field for structural errors; user-facing content such as email subject/body and password validation messages is localized.

## Dependencies

- **Upgrade policy:** Apply **patch and minor** updates routinely (e.g. `npm outdated` then bump versions and `npm install`). **Major** upgrades (e.g. @faker-js/faker, dotenv, eslint-plugin-perfectionist, express-rate-limit, lint-staged, nanoid, @types/node) are done separately with migration and testing. After any dependency change, run `npm run build` and `npm run lint`; commit the updated `package-lock.json` so CI and Docker use the same versions.
- **Linux-canonical lockfile:** CI runs on Linux and needs Linux optional deps (e.g. `@parcel/watcher`, `@next/swc-linux-x64-gnu`, next-intl's `@swc/core`) in the lockfile. Generate or refresh the lockfile under Linux x64 so it stays correct for CI: run `./scripts/development/update-lockfile-linux.sh` (requires Docker). The bump-version script runs this automatically before committing. When you add or update dependencies from a Mac, run that script and commit the updated `package-lock.json`.

## Code Quality

- Strict equality (`===` / `!==` only)
- Avoid type assertions (`as`); prefer types and narrowing
- Semicolons in JS/TS

### Import order

Imports must follow a consistent hierarchy and be alphabetized within groups: (1) Node built-ins, (2) external packages, (3) workspace packages (`@boilerplate/*`), (4) relative imports (parent, sibling, index), (5) style imports (SCSS/CSS) last. Type-only imports use a separate line (`import type { X } from '...'`) and are ordered with their group. Enforced by ESLint rule `perfectionist/sort-imports`; run `npm run lint:fix` to auto-fix.

## Skills and Rules

- **.cursor/skills/** – Project skills (one SKILL.md per directory). Use when the task matches the skill’s “when to use” so the agent follows the right patterns.
- **.cursor/rules/** – Glob-triggered or always-applied rules (e.g. eqeqeq, avoid-type-assertions, llm-history-tracking, path-casing). Rules apply automatically when editing matching files.

All configuration is project-scoped (no home-directory skills or rules).

### When to use which skill

| Task or area             | Skill(s) to use                                                                                                                                                                                                                                                                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **History / plans**      | **llm-history** when updating history or starting feature work. **plan-files-convention** when creating, saving, or completing multi-step plans (e.g. COPY-PASTA execution). **single-readme** when adding index/overview docs (repo has only one README at root). Plans live in `.llm/plans/active/`; split if over 300 lines (see **plan-creation** rule). |
| **API**                  | **api** for Express API patterns. **api-testing** when adding or changing API routes, auth, or env-dependent behavior (integration tests). **swagger-openapi** when changing API surface. **api-no-pii-credentials** rule applies to responses.                                                                                                              |
| **Web / management-web** | **web** for Next.js app patterns. **e2e-page-tests** when layout or behavior changes in web/management-web. **response-ending-make-verify** (and **end-with-targeted-make-report-verify** rule) for E2E verification commands. Use **make** E2E targets only (**e2e-run-with-make-only**).                                                                   |
| **i18n**                 | **i18n** when adding/editing translation keys, locales, or generating translations.                                                                                                                                                                                                                                                                          |
| **Forms / UI**           | **use-form-component**, **button-loading-async**, **password-strength-on-set-update**. **avoid-type-assertions**, **eqeqeq-strict-equality** rules apply.                                                                                                                                                                                                    |
| **DB / ORM**             | **database-schema-naming**, **typeorm-orderby-property-names**, **generate-data-sync** when schema or entities change. **nested-resource-prefix-naming** for nested resources.                                                                                                                                                                               |
| **K8s / Argo CD**        | **Remote cluster runbook:** [docs/development/REMOTE-K8S-GITOPS.md](docs/development/REMOTE-K8S-GITOPS.md). **argocd-gitops-push** when changing files under `infra/k8s/` or sync targets for k8s (add push-to-Git reminder in response so Argo CD can sync).                                                                                                |
| **Env / classification** | **classification-env** when adding or changing `infra/env/classification/`, env generators, or K8s env render.                                                                                                                                                                                                                                               |
| **Imports / paths**      | **path-casing-imports** when adding or changing relative imports (rule also applies on .ts/.tsx). **type-imports-separate-line** rule for type-only imports.                                                                                                                                                                                                 |

For **file-modifying work**: update `.llm/history/active/[feature]/` per **llm-history** and the **llm-history-tracking** rule. For **large or multi-step plans**: save under `.llm/plans/active/` and use **plan-files-convention**; execute via COPY-PASTA prompts one plan at a time.
