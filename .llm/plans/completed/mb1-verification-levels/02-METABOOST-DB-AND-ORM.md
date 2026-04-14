# 02 - Metaboost DB and ORM

## Scope

Add persistence and query support for MB1 verification levels and recipient outcomes.

## Key files

- `/Users/mitcheldowney/repos/pv/metaboost/infra/k8s/base/db/postgres-init/0003_app_schema.sql`
- `/Users/mitcheldowney/repos/pv/metaboost/packages/orm/src/entities/BucketMessage.ts`
- `/Users/mitcheldowney/repos/pv/metaboost/packages/orm/src/services/BucketMessageService.ts`

## Steps

1. Introduce new DB fields for verification state model:
   - normalized level field (enum/text)
   - optional recipient outcomes JSON payload
   - optional summary counters (success/failure/unknown, total recipients)
2. Define migration logic from legacy `payment_verified_by_app`:
   - `true` -> `fully-verified` (or agreed default in Phase 1)
   - `false` -> `not-verified`
3. Keep legacy field during transition if needed for compatibility; mark deprecation in docs.
4. Update ORM entity and serializers for new fields.
5. Add indexes for common list queries:
   - `(bucket_id, verification_level, created_at)`
   - `(bucket_id, is_public, verification_level, created_at)`
   - keep boost action filtering in index strategy.
6. Update service query builder filtering from binary verified flag to threshold semantics.

## Threshold query design

Use an ordered level map in service code:

- `fully-verified` -> rank 4
- `verified-largest-recipient-succeeded` -> rank 3
- `partially-verified` -> rank 2
- `not-verified` -> rank 1

Then filter with `rank >= thresholdRank`.

## Verification

- ORM read/write tests validate level persistence and threshold filtering.
- Existing boost list behavior remains stable under default threshold.
- Query plans confirm indexes are used for default public list patterns.
