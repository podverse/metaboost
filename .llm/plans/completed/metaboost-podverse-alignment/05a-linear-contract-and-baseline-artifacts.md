## Plan: 05a Linear Contract and Baseline Artifacts

Define canonical migration structure and generated bootstrap artifacts.

## Steps
1. Align canonical linear migration source directories with Podverse model under ops source paths.
2. Define baseline generation inputs and outputs (`0003` baseline, `0004` history seed) for app and management schemas.
3. Ensure generated artifact policy is explicit: generated files are machine-derived and committed.
4. Align related Cursor guidance files with Podverse when they govern migration-source and generated-baseline rules.

## Relevant files
- infra/k8s/base/ops/source/database/linear-migrations/app
- infra/k8s/base/ops/source/database/linear-migrations/management
- infra/k8s/base/db/source/bootstrap/0003_linear_baseline.sql
- infra/k8s/base/db/source/bootstrap/0004_seed_linear_migration_history.sql
- scripts/database/generate-linear-baseline.sh
- scripts/database/verify-linear-baseline.sh

## Verification
1. Baseline regeneration produces deterministic artifacts.
2. Verify script confirms generated outputs match source migrations.
3. Podverse reference-alignment checklist for directory and artifact contract is complete.
