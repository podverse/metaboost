# Phase A Plan: DB Baseline and Bootstrap Convergence

Goal: make metaboost baseline/bootstrap process mirror podverse model as closely as possible.

## Scope
1. Move deterministic migration-history row generation into baseline generation outputs (`0003a` and `0003b`).
2. Remove standalone `0004` runtime dependency once equivalence is proven.
3. Converge bootstrap script naming and responsibilities toward podverse structure.
4. Keep generated artifact workflow deterministic and CI-verifiable.

## Work items
1. Baseline generator parity
- Update `scripts/database/generate-linear-baseline.sh` to append deterministic migration-history inserts for app and management migrations.
- Ensure output remains two gz artifacts with deterministic bytes after regeneration.

2. Seed script deprecation
- Remove or retire `scripts/database/generate-linear-migration-history-seed.sh` from active workflow.
- Update `scripts/database/verify-linear-baseline.sh` to verify only converged generated artifacts and no standalone 0004 contract.

3. Bootstrap flow convergence
- Refactor/rename management bootstrap scripts to match podverse role separation where feasible.
- Remove duplicated grant logic if superseded by converged 0002 behavior.
- Update `infra/k8s/base/db/kustomization.yaml` to remove obsolete init artifact references.

4. Validation and determinism checks
- Validate migration naming/order and bundle sync.
- Regenerate baselines and verify no drift.
- Validate fresh-empty-volume bootstrap flow.

## Acceptance criteria
1. `0003a` and `0003b` embed migration-history rows matching current migration checksums.
2. No required runtime dependency on `0004_seed_linear_migration_history.sql` remains.
3. Bootstrap scripts align to owner/migrator/runtime role model comparable to podverse.
4. Verification scripts and CI gates pass with converged artifacts.

## Suggested execution order
1. Update generator and verifier first.
2. Regenerate artifacts and commit outputs.
3. Refactor bootstrap scripts and kustomization wiring.
4. Run validation and fresh bootstrap proof.
