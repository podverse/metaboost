# tools/generate-data

Populate the main and/or management database with high-volume, high-variation data permutations for
local UI and exploratory QA.

## Safety and isolation

- This tool is for local/dev data exploration and does **not** drive deterministic E2E seeding.
- Deterministic E2E seed scripts remain:
  - `tools/web/seed-e2e.mjs`
  - `tools/management-web/seed-e2e.mjs`
- `make e2e_seed_web`, `make e2e_seed_management_web`, and `make e2e_seed` continue to call only
  those deterministic scripts.
- DB guardrail: the CLI rejects likely test DB names unless `--allowTestDb` is explicitly passed.

## Prerequisites

- Main and/or management Postgres running and initialized.
- Env files present:
  - `apps/api/.env` for main DB seeding.
  - `apps/management-api/.env` for management DB seeding.
- Build packages first from repo root:
  - `./scripts/nix/with-env npm run build:packages`
  - `./scripts/nix/with-env npm run build -w tools/generate-data`

## CLI

Run from repo root:

```bash
./scripts/nix/with-env npm run generate -w tools/generate-data -- <main|management|both> [options]
```

### Options

- `--rows`, `-n`: base row count (default `100`).
- `--profile`: `small|medium|large|xl` (default `small`).
- `--seed`: faker seed for reproducibility.
- `--scenarioPack`: `main|management|full|rss-heavy|messages-heavy|authz-heavy` (default `full`).
- `--namespace`: prefix tag for generated records (default `gd-<timestamp>`).
- `--truncate`: truncate target seed tables before insert.
- `--append`: append mode (default).
- `--allowTestDb`: permit likely test DB names.
- `--skipValidation`: skip post-seed scenario validation checks.

### Examples

```bash
./scripts/nix/with-env npm run generate -w tools/generate-data -- main --rows 60 --profile medium --scenarioPack rss-heavy --seed 101 --truncate --namespace gd-main-rss-101
./scripts/nix/with-env npm run generate -w tools/generate-data -- management --rows 40 --profile large --scenarioPack authz-heavy --seed 202 --truncate --namespace gd-mgmt-authz-202
./scripts/nix/with-env npm run generate -w tools/generate-data -- both --rows 100 --profile xl --scenarioPack full --seed 303 --truncate --namespace gd-full-xl-303
```

## What gets seeded

### Main DB

- Users: `user`, `user_credentials`, `user_bio`.
- Bucket hierarchy permutations:
  - top-level `rss-network`
  - top-level `rss-channel`
  - nested `rss-channel` under networks
  - nested `rss-item` under channels
- Per-bucket settings in `bucket_settings` with varied `message_body_max_length`.
- RSS metadata permutations:
  - `bucket_rss_channel_info` with verified/unverified and parse timestamp variance.
  - `bucket_rss_item_info` with orphaned true/false and varied pub dates.
- Collaboration permutations:
  - `bucket_admin` CRUD permutations.
  - `bucket_role` custom role permutations.
  - `bucket_admin_invitation` status permutations (`pending`, `accepted`, `rejected`) and expiry variance.
- Message permutations:
  - `bucket_message` across boost/stream, public/private, varied `created_at`, optional `body` (stream may omit).
  - `bucket_message_value` rows with varied `currency`, `amount`, and `amount_unit` (including null unit).
  - Optional `bucket_message_app_meta` (app name/version, sender id, podcast index id, time position) for a subset of messages.

### Management DB

- Super admin is ensured (created if missing).
- Persona-based admin generation:
  - full CRUD
  - read-only
  - bucket-focused
  - bucket-admin-management-only
  - event-limited
- Core tables:
  - `management_user`
  - `management_user_credentials`
  - `management_user_bio`
  - `admin_permissions`
  - `management_admin_role`
- Event permutations in `management_event`:
  - varied actions, actor/target combinations, nullable fields, chronology spread.
- Optional `management_refresh_token` rows for authz-heavy/full scenario packs.

## Validation checks

When validation is enabled (default), the generator asserts:

- required scenario classes exist for the generated namespace;
- invitation statuses cover pending/accepted/rejected;
- management permission spread and event variety meet minimum thresholds.

Use `--skipValidation` only when iterating quickly and you intentionally do not need coverage checks.

## Coverage matrix (seeded scenario -> UI surface)

| Scenario area       | Seeded data shape                                     | Primary UI surfaces                                  |
| ------------------- | ----------------------------------------------------- | ---------------------------------------------------- |
| Bucket hierarchy    | network/channel/item tree with fan-out                | web bucket list/detail/settings                      |
| RSS metadata        | parse timestamps, verified/unverified, orphaned items | web bucket detail headers and metadata sections      |
| Collaboration       | admin CRUD masks, roles, invitations                  | web bucket admins/roles/invite flows                 |
| Messages and MB1    | message + value + optional app meta permutations      | web and management-web message lists/detail          |
| Management personas | permission matrix per admin persona                   | management-web admins/users/buckets authorization UX |
| Management events   | action, actor, target, nullable detail variance       | management-web events list/filter/sort states        |

## Drift checklist

When schema/entity changes land, update this generator with the same PR:

1. Update seeding logic for required columns/relations.
2. Update scenario coverage checks.
3. Update this document’s coverage matrix.
4. Run a validation seed command in both main and management modes.
5. Confirm E2E deterministic scripts remain unchanged.

## Manual QA workflow

1. Seed with an explicit namespace + seed:

```bash
./scripts/nix/with-env npm run generate -w tools/generate-data -- both --rows 80 --profile large --scenarioPack full --seed 4242 --truncate --namespace gd-qa-4242
```

2. Validate key surfaces:
   - Web bucket hierarchy views and settings behavior.
   - Web and management-web bucket message lists and detail.
   - Management-web role/permission gated pages.
   - Management events list filters and sort behavior.

3. Reseed with targeted packs for deep spot checks:

```bash
./scripts/nix/with-env npm run generate -w tools/generate-data -- main --rows 120 --profile xl --scenarioPack messages-heavy --seed 5252 --truncate --namespace gd-messages-5252
./scripts/nix/with-env npm run generate -w tools/generate-data -- management --rows 120 --profile xl --scenarioPack authz-heavy --seed 6262 --truncate --namespace gd-authz-6262
```

## Test password

All seeded users (main and management) use the fixed password `Test!1Aa` (bcrypt hashed).
