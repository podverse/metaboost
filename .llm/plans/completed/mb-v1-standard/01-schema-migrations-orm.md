# Schema & ORM

- Migration: `infra/k8s/base/db/postgres-init/0008_mb_bucket_types.sql` — extend `bucket.type` CHECK; optional CHECKs for `mb-root` top-level and `mb-mid`/`mb-leaf` parent required.
- ORM: `BUCKET_TYPE_VALUES`, `BucketMessage` bucket type unions.
- `BucketService`: `isAllowedChildType`, `createMbRoot`, `createMbMid`, `createMbLeaf`, ancestor validation (no cross-family).
