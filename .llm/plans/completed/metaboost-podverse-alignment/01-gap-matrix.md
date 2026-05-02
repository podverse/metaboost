# Gap Matrix: Metaboost vs Podverse

## Baseline and migration-history seeding
- Gap: metaboost still uses standalone `0004_seed_linear_migration_history.sql` generation/apply.
- Target: embed deterministic `linear_migration_history` rows directly in generated `0003a` and `0003b` baseline outputs, matching podverse model.
- Primary files:
  - metaboost/scripts/database/generate-linear-baseline.sh
  - metaboost/scripts/database/generate-linear-migration-history-seed.sh
  - metaboost/infra/k8s/base/db/source/bootstrap/0004_seed_linear_migration_history.sql
  - podverse/scripts/database/generate-linear-baseline.sh

## Bootstrap script structure
- Gap: metaboost management bootstrap flow still split through custom scripts (`0002_setup_management_database.sh`, `0006_management_grants.sh`).
- Target: converge to podverse-style role/bootstrap structure and script responsibilities.
- Primary files:
  - metaboost/infra/k8s/base/db/source/bootstrap/0001_create_app_db_users.sh
  - metaboost/infra/k8s/base/db/source/bootstrap/0002_setup_management_database.sh
  - metaboost/infra/k8s/base/db/source/bootstrap/0006_management_grants.sh
  - podverse/infra/k8s/base/db/source/bootstrap/0001_create_app_db_users.sh
  - podverse/infra/k8s/base/db/source/bootstrap/0002_create_management_db_users.sh

## Runner contract and path resolution
- Gap: metaboost runner still includes repo-root/path inference and local psql fallback behavior diverging from podverse contract shape.
- Target: align to podverse path contract with explicit `LINEAR_MIGRATIONS_BASE_DIR` / `LINEAR_MIGRATIONS_DIR` semantics.
- Primary files:
  - metaboost/infra/k8s/base/ops/source/database/runner/run-linear-migrations.sh
  - metaboost/infra/k8s/base/ops/source/database/runner/run-linear-migrations-k8s.sh
  - podverse/infra/k8s/base/ops/source/database/runner/run-linear-migrations.sh
  - podverse/infra/k8s/base/ops/source/database/runner/run-linear-migrations-k8s.sh

## K8s ops job wiring
- Gap: metaboost migration cronjobs can be tightened to podverse-style mount/env conventions.
- Target: converge mount paths and env wiring so migration assets and base-dir contract are explicit and portable.
- Primary files:
  - metaboost/infra/k8s/base/ops/db-migrate-app.cronjob.yaml
  - metaboost/infra/k8s/base/ops/db-migrate-management.cronjob.yaml
  - metaboost/infra/k8s/base/ops/kustomization.yaml

## CI and local test process
- Gap: metaboost CI and local test init still use direct schema file application in key paths.
- Target: switch to migration-runner driven DB init for app and management, matching production-style process.
- Primary files:
  - metaboost/.github/workflows/ci.yml
  - metaboost/makefiles/local/Makefile.local.test.mk

## Bootstrap-contract verification and extension-runtime guards
- Gap: metaboost parity still needs explicit podverse-style bootstrap-contract verification and runtime `CREATE EXTENSION` guard checks in CI.
- Target: add contract checks that validate bootstrap invariants and block runtime extension creation patterns in app code paths.
- Primary files:
  - metaboost/scripts/database/ci-verify-bootstrap-contract.sh
  - metaboost/scripts/database/verify-bootstrap-contract.sh
  - metaboost/scripts/database/check-no-runtime-create-extension.sh
  - metaboost/.github/workflows/ci.yml

## Ops overlay image pinning policy
- Gap: podverse recently pinned workers images in alpha ops overlays; metaboost alignment plan should include equivalent anti-drift image pin policy checks where applicable.
- Target: pin ops overlay image references for metaboost workloads where floating tags can cause pull/runtime drift.
- Primary files:
  - metaboost/infra/k8s/alpha/ops/kustomization.yaml (or equivalent ops overlays)
  - `<metaboost-gitops-repo>/apps/metaboost-alpha/**`

## Env and secret naming contracts across gitops repos
- Gap: need full convergence and enforcement checks across the Metaboost GitOps repository and any related operator GitOps surfaces.
- Target: enforce role-based DB key family only (`DB_APP_OWNER_*`, `DB_APP_MIGRATOR_*`, `DB_APP_READ_*`, `DB_APP_READ_WRITE_*`, and management equivalents), forbid legacy admin key patterns.
- Primary files:
  - `<metaboost-gitops-repo>/scripts/secret-generators/*`
  - `<podverse-gitops-repo>/scripts/secret-generators/*`
  - `<podverse-gitops-repo>/apps/metaboost-alpha/**`

## Docs and anti-drift controls
- Gap: metaboost docs still reflect transitional divergence language.
- Target: document converged podverse-like contract and enforce generated-artifact discipline in docs/rules.
- Primary files:
  - metaboost/docs/development/DB-MIGRATIONS.md
  - metaboost/docs/development/repo-management/LINEAR-MIGRATIONS-REFERENCE-ALIGNMENT-CHECKLIST-05A.md
