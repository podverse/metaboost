## Plan: 05b Linear Runner Scripts and Make Targets

Implement runner and operator tooling for forward-only migrations.

## Steps
1. Align run/validate/status migration scripts to canonical linear source paths.
2. Ensure app and management DB paths are both supported and consistently reported.
3. Add or update Make targets for linear run/verify/status commands.
4. Remove any remaining template contract helper invocations from touched Make targets and scripts (do not leave `scripts/env-template contract/*` or template contract-validate hooks in migrated paths).
5. Align related Cursor guidance files with Podverse for migration tooling conventions where directly relevant.

## Relevant files
- scripts/database/run-linear-migrations.sh
- scripts/database/run-linear-migrations-k8s.sh
- scripts/database/print-linear-migrations-status-k8s.sh
- scripts/database/validate-linear-migrations.sh
- makefiles/local/Makefile.local.validate.mk
- makefiles/local/Makefile.local.mk

## Verification
1. Runner scripts execute successfully for app and management DBs.
2. Status output is stable and usable for operators.
3. Touched make/script paths are template contract-free.
4. `./scripts/nix/with-env npm run build` and `./scripts/nix/with-env npm run lint` pass.
