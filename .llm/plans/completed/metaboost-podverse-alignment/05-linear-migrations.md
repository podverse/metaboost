## Plan: Linear Migrations Process Parity

Align Metaboost linear migration workflow with Podverse contract for canonical migration directories, generated baseline artifacts, and verify plus regen tooling.

This phase is split into smaller executable plans to reduce risk and review size:

1. [05a-linear-contract-and-baseline-artifacts.md](../../completed/metaboost-podverse-alignment/05a-linear-contract-and-baseline-artifacts.md) (completed)
2. [05b-linear-runner-scripts-and-make-targets.md](../../completed/metaboost-podverse-alignment/05b-linear-runner-scripts-and-make-targets.md) (completed)
3. [05c-linear-ci-validation-and-docs.md](05c-linear-ci-validation-and-docs.md)

## Steps
1. Complete 05a, then 05b, then 05c in strict order.
2. Do not start k8s app-of-apps phase until 05c verification passes.
3. Keep Cursor alignment scoped to migration/db-related files only when directly affected.
4. Apply greenfield schema contract updates directly in canonical CREATE TABLE based artifacts.

## Relevant files
- scripts/database/run-linear-migrations.sh
- scripts/database/run-linear-migrations-k8s.sh
- scripts/database/print-linear-migrations-status-k8s.sh
- scripts/database/validate-linear-migrations.sh
- scripts/database/generate-linear-baseline.sh
- scripts/database/verify-linear-baseline.sh
- infra/k8s/base/db/source/bootstrap/0003_linear_baseline.sql
- infra/k8s/base/db/source/bootstrap/0004_seed_linear_migration_history.sql
- infra/k8s/base/ops/source/database/linear-migrations/app
- infra/k8s/base/ops/source/database/linear-migrations/management
- makefiles/local/Makefile.local.validate.mk

## Verification
1. All verification gates in 05a, 05b, and 05c pass.
2. Migrations reference-alignment checklist against Podverse is complete.

## Decisions
- Forward-only linear model.
- Generated baseline artifacts are machine-derived and committed.
- Greenfield contract and breaking updates allowed.
- Cursor alignment is in-scope only for migration/db-related `.cursor` files touched by this phase.
