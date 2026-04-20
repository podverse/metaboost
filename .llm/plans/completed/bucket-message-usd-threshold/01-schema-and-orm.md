# 01 - Schema and ORM

## Scope
Add persistent schema/ORM support for:
- Bucket-level minimum threshold in USD cents.
- Message create-time USD cents snapshot used for filtering.

## Steps
1. Update DB schema SQL in `infra/k8s/base/db/postgres-init/0003_app_schema.sql`:
   - Add `minimum_message_usd_cents INTEGER NOT NULL DEFAULT 0` to `bucket_settings`.
   - Add `usd_cents_at_create INTEGER NULL` to `bucket_message_value`.
2. Update ORM entities:
   - `BucketSettings` adds `minimumMessageUsdCents`.
   - `BucketMessageValue` adds `usdCentsAtCreate`.
3. Update bucket settings constants/validation:
   - Add min/max constants for threshold cents in `@metaboost/helpers` bucket constants.
4. Update `BucketService` data pathways:
   - Ensure create/inheritance initializes threshold.
   - Ensure update and descendant propagation methods accept threshold field.
5. Update `BucketMessageService.create` data contract:
   - Accept optional `usdCentsAtCreate` and persist it on value row.
6. Export updates:
   - Ensure changed entities/services are still exported in package indexes if needed.

## Key Files
- `infra/k8s/base/db/postgres-init/0003_app_schema.sql`
- `packages/orm/src/entities/BucketSettings.ts`
- `packages/orm/src/entities/BucketMessageValue.ts`
- `packages/orm/src/services/BucketService.ts`
- `packages/orm/src/services/BucketMessageService.ts`
- `packages/helpers/src/bucket/constants.ts` (or current bucket constants file)

## Verification
- Type-checks compile for ORM and API imports.
- DB schema and entity column names match snake_case DB naming.
- Existing create/list code paths remain backward-compatible before filtering logic is wired.
