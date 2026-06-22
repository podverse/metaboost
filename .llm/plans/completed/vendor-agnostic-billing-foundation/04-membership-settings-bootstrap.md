# 04 — Membership Settings Bootstrap (Metaboost)

## Scope

- Define canonical membership product settings storage for trial and product defaults.
- Make DB-backed settings resolution deterministic with safe env bootstrap.

## Steps

1. Add a dedicated membership settings table for canonical defaults.
   - prefer one-row keyed settings for current premium membership product
   - include free-trial expiration in seconds
   - include timestamps and update trigger patterns consistent with repo conventions
2. Add ORM entity/service wiring for settings resolution.
3. Implement startup-safe seeding logic:
   - read env defaults
   - insert/update only when DB values are missing
   - avoid overwriting intentional DB-managed values
4. Wire settings resolution into price/product catalog resolution service.
5. Align env template and validation references to settings bootstrap behavior.

## Key files to touch later

- `infra/k8s/base/ops/source/database/linear-migrations/app/`
- `packages/orm/src/entities/`
- `packages/orm/src/services/`
- `packages/helpers/src/membership/`
- `apps/api/src/lib/startup/validation.ts`
- `apps/management-api/src/lib/startup/validation.ts`

## Verification

- Settings table exists with expected constraints.
- Bootstrap is idempotent across repeated startups.
- Runtime reads resolve DB values first and use env only as bootstrap source.
- No endpoint returns unresolved or partially merged settings payloads.
