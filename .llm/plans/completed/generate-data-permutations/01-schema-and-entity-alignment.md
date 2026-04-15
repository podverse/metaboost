# 01 - Schema and Entity Alignment

## Scope

Make `tools/generate-data` schema-accurate for required columns and current ORM/entity expectations before adding richer permutations.

## Steps

1. Audit all entities registered in ORM data sources and map required fields per table.
2. Align generator writes with required fields (`short_id`, required FKs, non-null enums, bounded numeric columns).
3. Add a seeding contract layer (typed builders/validators) to fail fast when generators omit required fields.
4. Ensure compatibility with normalized message verification tables.

## Key files

- `/Users/mitcheldowney/repos/pv/metaboost/tools/generate-data/src/main/seed.ts`
- `/Users/mitcheldowney/repos/pv/metaboost/tools/generate-data/src/management/seed.ts`
- `/Users/mitcheldowney/repos/pv/metaboost/tools/generate-data/src/main/data-source.ts`
- `/Users/mitcheldowney/repos/pv/metaboost/tools/generate-data/src/management/data-source.ts`
- `/Users/mitcheldowney/repos/pv/metaboost/packages/orm/src/data-source.ts`
- `/Users/mitcheldowney/repos/pv/metaboost/infra/k8s/base/db/postgres-init/0003_app_schema.sql`

## Verification

- Build and run `tools/generate-data` with a minimal row count in each mode (`main`, `management`, `both`).
- Verify no insert failures due to required column omissions.
- Verify this phase does not touch:
  - `/Users/mitcheldowney/repos/pv/metaboost/tools/web/seed-e2e.mjs`
  - `/Users/mitcheldowney/repos/pv/metaboost/tools/management-web/seed-e2e.mjs`
