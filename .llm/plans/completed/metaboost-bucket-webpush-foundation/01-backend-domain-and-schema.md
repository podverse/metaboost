# 01 - Backend Domain and Schema (Metaboost)

## Scope

- Add per-user, per-bucket notification preferences.
- Add Web Push subscription storage.
- Ensure sub-bucket inheritance on creation.
- Keep design channel-agnostic for future push channels.

## Steps

1. Add notification preference persistence.
   - New table/entity: user + bucket + enabled + timestamps.
   - Unique key on (user_id, bucket_id).
2. Add Web Push endpoint persistence.
   - New table/entity for endpoint, keys (p256dh/auth), locale, user ownership, timestamps.
   - Unique endpoint constraint.
3. Add service methods for upsert/list/delete for both preference and webpush device records.
4. Add inheritance behavior for child bucket creation.
   - When creating a child bucket, copy explicit parent preference rows to the new child bucket.
   - Apply in shared bucket create flow so it works for manual child creation and RSS sync-created item buckets.
5. Add linear SQL migration updates and ORM mappings.

## Key files

- packages/orm/src/entities/Bucket.ts
- packages/orm/src/entities/BucketSettings.ts
- packages/orm/src/services/BucketService.ts
- infra/k8s/base/ops/source/database/linear-migrations/app/0001_app_schema.sql

## Exit criteria

- New persistence tables/entities exist and compile.
- Child bucket creation inherits parent notification preferences.
- No bucket-global notification flag is introduced (preference stays per-user).