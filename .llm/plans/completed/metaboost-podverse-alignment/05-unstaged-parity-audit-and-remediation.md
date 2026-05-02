# Phase D: Unstaged Parity Audit and Remediation

Goal: ensure current metaboost unstaged changes are fully aligned with the present podverse DB/migration/K8s/CI/testing contract, then remediate remaining gaps.

## PASS/FAIL checklist

1. Baseline seed model parity
- PASS condition: deterministic `linear_migration_history` seed rows are embedded in generated `0003a_*` and `0003b_*` baseline artifacts.
- FAIL condition: standalone bootstrap dependency on `0004_seed_linear_migration_history.sql` remains.

2. Bootstrap script responsibility parity
- PASS condition: app/management user+role setup structure matches podverse responsibilities (`0001` app users, `0002` management users) without bespoke divergent grant flow.
- FAIL condition: additional bootstrap scripts are required for role wiring that podverse handles in baseline bootstrap.

3. Runner contract parity
- PASS condition: canonical runners support explicit `LINEAR_MIGRATIONS_BASE_DIR` and `LINEAR_MIGRATIONS_DIR` path contract and avoid duplicate script copies.
- FAIL condition: duplicated runner logic exists across script paths and diverges.

4. K8s migration job wiring parity
- PASS condition: migration jobs mount and export path envs consistently so runner path contract is explicit and deterministic.
- FAIL condition: jobs rely on implicit or repo-relative resolution.

5. CI/local test DB-init parity
- PASS condition: CI and local test DB setup runs through forward-only migration runner for app and management databases.
- FAIL condition: direct schema imports are still used where runner parity is required.

6. Role-based env/secret naming parity
- PASS condition: key families are role-based only (`DB_APP_OWNER_*`, `DB_APP_MIGRATOR_*`, `DB_APP_READ_WRITE_*`, `DB_APP_READ_*`, plus management equivalents).
- FAIL condition: legacy admin-key names are still accepted in metaboost or linked gitops repos.

## Immediate remediation tasks

1. Remove standalone 0004 dependency
- Move migration-history seeding fully into generated baseline flow.
- Retire `infra/k8s/base/db/source/bootstrap/0004_seed_linear_migration_history.sql` once generators and checks are updated.

2. Collapse remaining bootstrap drift
- Align management grants/setup script responsibilities with podverse model.
- Eliminate extra bootstrap steps that are only transitional.

3. Wire runner parity end-to-end in jobs and CI
- Ensure cronjobs and CI/test flows pass and/or export explicit migration path envs where required.
- Ensure app and management test DB init both use runner path.

4. Enforce naming contracts
- Add or tighten checks in metaboost, the Metaboost GitOps repository, and related operator GitOps repos to reject legacy admin keys for metaboost surfaces.

## Verification commands

```bash
bash scripts/database/validate-linear-migrations.sh
bash scripts/database/verify-linear-baseline.sh
make check_k8s_postgres_init_sync
./scripts/nix/with-env npm run lint
./scripts/nix/with-env npm run build
```

If CI/test init paths are modified in this phase, also run:

```bash
make test_deps
./scripts/nix/with-env npm run test:e2e:api
```
