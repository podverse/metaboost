# Linear Migrations Reference Alignment Checklist (05a)

Date: 2026-04-28
Phase: 05a-linear-contract-and-baseline-artifacts

## Scope

- Canonical linear migration source directories under ops source paths.
- Generated bootstrap baseline artifacts 0003 and 0004.
- Baseline regeneration and verification scripts.

## Checklist

- [x] Canonical migration source directories exist:
  - `infra/k8s/base/ops/source/database/linear-migrations/app`
  - `infra/k8s/base/ops/source/database/linear-migrations/management`
- [x] Baseline generator exists: `scripts/database/generate-linear-baseline.sh`.
- [x] Migration-history seed generator exists: `scripts/database/generate-linear-migration-history-seed.sh`.
- [x] Baseline verifier exists: `scripts/database/verify-linear-baseline.sh`.
- [x] Generated baseline artifact exists and is committed:
  - `infra/k8s/base/db/source/bootstrap/0003_linear_baseline.sql.gz`
- [x] Generated migration-history seed exists and is committed:
  - `infra/k8s/base/db/source/bootstrap/0004_seed_linear_migration_history.sql`
- [x] Cursor migration guidance updated for generated-baseline contract:
  - `.cursor/skills/linear-db-migrations/SKILL.md`

## Intentional Divergences

- Linear runner and validation scripts still read the legacy `infra/k8s/base/db/source/{app,management}` paths in this phase. Full runner/validate path cutover is deferred to 05b and 05c.
