---
name: linear-db-migrations
description: Canonical linear DB migrations under infra/k8s/base/db/source, ops bundles, env keys, and runners. Use when adding or changing SQL migrations, K8s DB bootstrap, or scripts/database in this repo.
version: 1.0.0
---

# Linear database migrations (Metaboost)

## When to use

- Adding or changing files under `infra/k8s/base/db/source/`, `infra/k8s/base/ops/`, or `scripts/database/`.
- Wiring DB credentials in Compose, k3d, or K8s manifests, or in `infra/env/classification/`.

## Single source of truth

- **App and management SQL:** `infra/k8s/base/db/source/app/` and `infra/k8s/base/db/source/management/` (ordered `0001_*.sql`, …).
- **Bootstrap only (users/roles, not app schema in init):** `infra/k8s/base/db/source/bootstrap/` shell scripts, mounted for `docker-entrypoint-initdb.d` where applicable.

## Runner and validation

- Apply migrations: `bash scripts/database/run-linear-migrations.sh --database app|management` (always pass `--database`; there is no default).
- K8s wrapper: `bash scripts/database/run-linear-migrations-k8s.sh` (same requirement).
- Validate: `bash scripts/database/validate-linear-migrations.sh` (and `--check-db` to compare on-disk checksums to `linear_migration_history` when a DB is available).
- The migration runner **creates** the `linear_migration_history` table if missing; do not rely on a dedicated SQL file for that.

## Ops bundle (cache busting)

- `infra/k8s/base/ops/kustomization.yaml` must list every `.sql` file under the app and management `source` directories so the ops jobs ConfigMaps stay in sync.
- Kustomize may load paths outside the ops directory; when building, use e.g. `kubectl kustomize infra/k8s/base/ops --load-restrictor LoadRestrictionsNone`.

## Environment keys (admin vs image)

- **Authoritative in secrets and generated env:** `DB_APP_ADMIN_USER` / `DB_APP_ADMIN_PASSWORD`, `DB_MANAGEMENT_ADMIN_USER` / `DB_MANAGEMENT_ADMIN_PASSWORD`, plus read-only and read-write keys and `DB_APP_NAME` / `DB_MANAGEMENT_NAME` (see `infra/env/classification/base.yaml` and local `infra/config/local/db.env` after `scripts/local-env/setup.sh`).
- The **postgres** container image still reads `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` at runtime—**map** those from the `DB_*_ADMIN_*` and `DB_APP_NAME` keys in Compose or Deployment `env`, not the reverse.

## Podverse parity (cross-repo invariants)

- One tree under `infra/k8s/base/db/source/`, forward-only files, same npm script names in root `package.json` (`db:migrate:linear:*`, `db:validate:linear`, etc.). Product-specific naming (`metaboost-*` vs `podverse-*`) is expected.

## Documentation

- [docs/development/DB-MIGRATIONS.md](../../../docs/development/DB-MIGRATIONS.md) – full runbook and contracts.

## Related skills

- [database-schema-naming](../database-schema-naming/SKILL.md) – snake_case schema rules.
- [argocd-gitops-push](../argocd-gitops-push/SKILL.md) – push reminder when k8s paths change.
- [generate-data-sync](../generate-data-sync/SKILL.md) – seeders when schema changes.
