# tools/generate-data

Populate the main and/or management database with configurable faker-generated test data for
local development and testing.

## Prerequisites

- Main and/or management Postgres running; databases created (e.g. via `make local_infra_up` or
  equivalent).
- Env files present: `apps/api/.env` (for main), `apps/management-api/.env` (for management).
  Copy from the corresponding `.env.example` if needed.
- From repo root, build packages first: `npm run build:packages` (or build `@metaboost/helpers`,
  `@metaboost/orm`, `@metaboost/management-orm`).

## Commands

Run from **repository root**. Use the Nix wrapper if Node is provided by the flake (e.g. in Cursor
agent): `./scripts/nix/with-env <command>`.

| Target       | Command                                                            |
| ------------ | ------------------------------------------------------------------ |
| Main DB only | `npm run generate -w tools/generate-data -- main [--rows N]`       |
| Management   | `npm run generate -w tools/generate-data -- management [--rows N]` |
| Both         | `npm run generate -w tools/generate-data -- both [--rows N]`       |

- **Default rows**: 100 if `--rows` / `-n` is omitted.
- **Examples**:
  - `npm run generate -w tools/generate-data -- main --rows 50`
  - `npm run generate -w tools/generate-data -- both --rows 200`

## Environment

- **Main**: Uses `DB_HOST`, `DB_PORT`, `DB_APP_NAME`, `DB_APP_READ_WRITE_USER`, `DB_APP_READ_WRITE_PASSWORD`
  from `apps/api/.env`.
- **Management**: Uses the same keys as management-api / `@metaboost/management-orm`: `DB_HOST`, `DB_PORT`,
  `DB_MANAGEMENT_NAME`, `DB_MANAGEMENT_READ_WRITE_USER`, `DB_MANAGEMENT_READ_WRITE_PASSWORD` from `apps/management-api/.env`.

## What gets seeded

- **Main** (per row): one `user`, one `user_credentials`, one `user_bio`. Then 5 top-level
  `bucket` rows (owner = user), and for each of those 50 child `bucket` rows (sub-buckets,
  `parent_bucket_id` set). Names from faker. Email and display name
  from faker; all users share the same test password (see below).
- **Management**: First, if no super admin exists, one is created (`superadmin@example.com`, test
  password `Test!1Aa`). This is skipped when a super admin is already present (e.g. from
  `create-super-admin.mjs` during local startup). Then, per row: one `management_user` (non–super-admin),
  one `management_user_credentials`, one `management_user_bio`, one `admin_permissions`. Same test
  password. Finally, `management_event` audit rows are seeded (count based on rows; actions like
  `user_created`, `admin_updated`, etc., with actor/target references).

**Test password**: All seeded users (main and management) use the fixed password `Test!1Aa`
(hashed with bcrypt) so you can log in for testing.

## Keeping in sync

When new tables or entities are added to the main or management database, update the seed logic and
this doc. Use the **generate-data-sync** skill (`.cursor/skills/generate-data-sync/SKILL.md`).
