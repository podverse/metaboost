# Linear Migrations Reference Alignment Checklist (05a)

Date: 2026-04-28
Phase: 05a-linear-contract-and-baseline-artifacts

## Scope

- Canonical linear migration source directories under ops source paths.
- Generated bootstrap baseline artifacts 0003a/0003b and apply script.
- Baseline regeneration and verification scripts.

## Checklist

- [x] Canonical migration source directories exist:
  - `infra/k8s/base/ops/source/database/linear-migrations/app`
  - `infra/k8s/base/ops/source/database/linear-migrations/management`
- [x] Baseline generator exists: `scripts/database/generate-linear-baseline.sh`.
- [x] Baseline verifier exists: `scripts/database/verify-linear-baseline.sh`.
- [x] Generated baseline artifacts exist and are committed:
  - `infra/k8s/base/db/source/bootstrap/0003a_app_linear_baseline.sql.gz`
  - `infra/k8s/base/db/source/bootstrap/0003b_management_linear_baseline.sql.gz`
  - `infra/k8s/base/db/source/bootstrap/0003_apply_linear_baselines.sh` (hand-maintained apply script)
- [x] Standalone migration-history seed is not part of active bootstrap wiring.
- [x] Cursor migration guidance updated for generated-baseline contract:
  - `.cursor/skills/linear-db-migrations/SKILL.md`

## Intentional Divergences

- None in the active bootstrap wiring for this checklist scope.
