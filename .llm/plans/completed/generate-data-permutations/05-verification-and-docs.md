# 05 - Verification and Documentation

## Scope

Add confidence checks and documentation so permutation seeding remains correct as schema evolves.

## Steps

1. Add generator validation tests:
   - schema-required field presence
   - relationship integrity checks
   - scenario presence assertions for each permutation class.
2. Add a coverage matrix doc mapping seeded scenarios to UI surfaces.
3. Add a “drift checklist” for new schema/entity changes:
   - update generator mappings
   - update coverage matrix
   - rerun generator verification.
4. Document a recommended manual QA workflow:
   - seed profile selection
   - key UI pages to inspect
   - expected data signatures.
5. Add explicit E2E safety note:
   - deterministic seed scripts are separate and should remain the source of truth for E2E reproducibility.

## Key files

- `/Users/mitcheldowney/repos/pv/metaboost/tools/generate-data/TOOLS-GENERATE-DATA.md`
- `/Users/mitcheldowney/repos/pv/metaboost/docs/testing/E2E-PAGE-TESTING.md`
- `/Users/mitcheldowney/repos/pv/metaboost/docs/testing/TEST-SETUP.md`
- `/Users/mitcheldowney/repos/pv/metaboost/tools/generate-data/src/` (test files to be added under this workspace)

## Verification

- Run generator checks in CI/local before shipping generator updates.
- Run scoped web and management-web E2E commands after generator changes to confirm deterministic test process is unaffected.
