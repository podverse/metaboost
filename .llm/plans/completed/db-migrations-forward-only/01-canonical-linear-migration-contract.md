# Phase 1 - Metaboost canonical linear migration contract

## Scope

Define canonical forward-only migration layout and baseline behavior while preserving first-start bootstrap from current postgres-init assets.

## Key files

- `infra/k8s/base/db/postgres-init/0003_app_schema.sql`
- `infra/k8s/base/db/postgres-init/0005_management_schema.sql.frag`
- `infra/migrations/app/` (new canonical linear app migrations)
- `infra/migrations/management/` (new canonical linear management migrations)
- `infra/k8s/base/db/kustomization.yaml`
- `infra/k8s/base/stack/kustomization.yaml`

## Steps

1. **Canonical directory decision**
   - Use `infra/migrations/app` + `infra/migrations/management` as authoritative forward-only sources.
   - Keep postgres-init SQL files as generated/derived bootstrap artifacts for first initialization.

2. **Migration metadata and safety model**
   - Define migration history table(s) and checksum semantics.
   - Require DB lock around apply flow to prevent concurrent runner collisions.
   - Define behavior for checksum mismatch and partial-failure recovery.

3. **Bootstrap integration**
   - Ensure first-start bootstrap still creates latest schema and migration metadata baseline.
   - Define how bootstrap marks pre-included migrations as applied (baseline seed rows or equivalent marker strategy).

4. **Existing DB adoption**
   - Provide baseline migration onboarding path for already-running DBs so old schemas can enter forward-only history without replaying all historical SQL.

## Verification

- Fresh DB bootstrap still succeeds and lands at latest schema for app and management DBs.
- Migration metadata tables exist and are queryable immediately after bootstrap.
- Canonical migration directories are documented and enforced in scripts.
