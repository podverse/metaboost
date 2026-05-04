---
name: linear-baseline-gz-sync
description: Regenerate committed linear baseline .sql.gz artifacts whenever app/management linear SQL migrations change.
---

# Linear Baseline GZ Sync (Metaboost)

Use this skill whenever you add, remove, or edit files under:

- `infra/k8s/base/ops/source/database/linear-migrations/app/**`
- `infra/k8s/base/ops/source/database/linear-migrations/management/**`
- `scripts/database/generate-linear-baseline.sh`

## Goal

Keep committed bootstrap baseline archives aligned with the canonical forward-only SQL chain.

## Required actions

1. Regenerate baseline archives from repo root:
   - `bash scripts/database/generate-linear-baseline.sh`
2. Verify generated output is current:
   - `bash scripts/database/verify-linear-baseline.sh`
3. Commit changed generated artifacts when they differ:
   - `infra/k8s/base/db/source/bootstrap/0003a_app_linear_baseline.sql.gz`
   - `infra/k8s/base/db/source/bootstrap/0003b_management_linear_baseline.sql.gz`

## Related files to keep aligned

- `infra/k8s/base/ops/kustomization.yaml` (migration file wiring)
- `infra/k8s/base/api/source/api.env` and `infra/k8s/base/management-api/source/management-api.env` (expected migration markers)

## Notes

- Do not hand-edit `.sql.gz` archives.
- Generated baseline artifacts are source-controlled and must be updated in the same PR as migration changes.
