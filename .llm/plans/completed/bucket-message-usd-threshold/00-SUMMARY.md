# Bucket Message USD Threshold - Summary

## Scope
- Add `minimumMessageUsdCents` setting to top-level bucket general settings.
- Persist create-time USD cents snapshot for each message value row.
- Filter message list endpoints using USD-cents-only threshold semantics.
- Support optional request-time minimum threshold query parameter for list endpoints.
- Ensure descendant bucket views use the top-level threshold baseline.

## Core Rules
- Threshold units are cents (`1` = $0.01, `100` = $1.00).
- Filtering basis is always create-time USD cents snapshot.
- Effective threshold is `max(topLevelBucketThreshold, requestMinUsdCents?)`.
- Snapshot value is written at message creation and never recomputed.

## Primary Technical Areas
- **DB/ORM**: `bucket_settings` + `bucket_message_value` schema and entities.
- **Ingest**: shared standard ingest persistence path assigns USD cents snapshot.
- **List APIs**: owner/admin and public standard list endpoints apply min filter.
- **UI/Types**: bucket settings form and request/response types include threshold.
- **Contract/Test**: OpenAPI and automated test coverage updated.

## Key Files
- `infra/k8s/base/db/postgres-init/0003_app_schema.sql`
- `packages/orm/src/entities/BucketSettings.ts`
- `packages/orm/src/entities/BucketMessageValue.ts`
- `packages/orm/src/services/BucketService.ts`
- `packages/orm/src/services/BucketMessageService.ts`
- `apps/api/src/lib/standardIngest/persistBoostMessage.ts`
- `apps/api/src/controllers/bucketMessagesController.ts`
- `apps/api/src/controllers/mbV1Controller.ts`
- `apps/api/src/controllers/mbrssV1Controller.ts`
- `apps/api/src/schemas/buckets.ts`
- `apps/management-api/src/schemas/buckets.ts`
- `apps/web/src/app/(main)/buckets/BucketForm.tsx`
- `apps/management-web/src/components/buckets/BucketForm.tsx`
- `packages/helpers-requests/src/types/bucket-types.ts`

## Decisions Recorded
- Descendant views read top-level threshold as baseline.
- Request-time min threshold remains optional and can only tighten filtering.
- Existing messages may have null snapshot until backfill strategy is defined.
