# Phase 2 - Metaboost linear scripts, CI, and Makefile cutover

## Scope

Use forward-only run/validate/status tooling across scripts, CI, and Make targets.

## Key files

- `scripts/database/run-linear-migrations.sh` (new)
- `scripts/database/run-linear-migrations-k8s.sh` (new)
- `scripts/database/print-linear-migrations-status-k8s.sh` (new)
- `scripts/database/validate-linear-migrations.sh` (new)
- `makefiles/local/Makefile.local.test.mk`
- `makefiles/local/Makefile.local.k3d.mk`
- `package.json`
- `.github/workflows/ci.yml` (if referencing old script names)

## Steps

1. **Add forward-only tooling**
   - Implement migration runner for app + management DBs with:
     - ordered discovery;
     - lock acquisition;
     - transactional apply;
     - migration history writes.
   - Implement validation and status scripts suitable for CI and operators.

2. **K8s execution entrypoint**
   - Provide non-interactive script mode for K8s one-off jobs with deterministic exit codes.

3. **Cutover CI and make commands**
   - Use linear validation/status invocations in Makefiles and CI.
   - Ensure `validate_ci` and related targets no longer reference non-linear naming.

4. **Cleanup migration scripts**
   - Delete obsolete scripts that are no longer part of the linear process.

## Verification

- Make/CI commands complete using only linear migration scripts.
- Local migration status command shows pending/applied output for both app and management DBs.
- Non-linear script names are absent from active execution paths.
