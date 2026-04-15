# 04 - CLI, Config, and Ops Guardrails

## Scope

Make permutation seeding configurable, reproducible, and safe to run without interfering with deterministic E2E seed workflows.

## Steps

1. Extend CLI arguments:
   - `--rows`
   - `--profile` (small/medium/large/xl)
   - `--seed` (random seed for deterministic faker output)
   - `--scenarioPack` (main, management, full, rss-heavy, messages-heavy, authz-heavy).
2. Add explicit run mode guardrails:
   - reject accidental execution against test DBs when not intended
   - optional `--allowTestDb` escape hatch.
3. Add idempotency/cleanup strategy flags:
   - truncate before seed
   - append mode
   - namespace tagging for generated records.
4. Keep deterministic E2E seed process isolated:
   - no dependencies from e2e make targets to generate-data
   - no modifications to `tools/web/seed-e2e.mjs` / `tools/management-web/seed-e2e.mjs`.
5. Improve command docs and examples for local/dev workflows.

## Key files

- `/Users/mitcheldowney/repos/pv/metaboost/tools/generate-data/src/cli.ts`
- `/Users/mitcheldowney/repos/pv/metaboost/tools/generate-data/package.json`
- `/Users/mitcheldowney/repos/pv/metaboost/tools/generate-data/TOOLS-GENERATE-DATA.md`
- `/Users/mitcheldowney/repos/pv/metaboost/makefiles/local/Makefile.local.e2e.mk` (verification-only reference)

## Verification

- Run CLI with multiple profile/seed combinations and confirm reproducible outputs where expected.
- Confirm `make e2e_seed_web`, `make e2e_seed_management_web`, and `make e2e_seed` still call only deterministic seed scripts.
