# 09 - SQL Threshold Path and Query Rename

## Scope
Harden threshold filtering performance and API clarity by replacing full-scan read-time filtering with a SQL-backed path and introducing a breaking query rename from `minimumAmountUsdCents` to `minimumAmountMinor`.

## Steps
1. Replace all-candidate in-memory threshold filtering in API list/read paths with SQL-backed filtering.
   - Use existing persisted snapshot basis in `bucket_message_value` and `BucketMessageService` query options.
   - Keep root bucket threshold + request threshold max behavior.
2. Introduce and enforce new query parameter name:
   - `minimumAmountMinor` (non-negative integer minor units)
   - remove support for `minimumAmountUsdCents` in API and management-api list/read query parsing.
3. Update `message-threshold-filter` helpers to:
   - parse the renamed query parameter,
   - avoid loading all candidate messages solely for threshold filtering.
4. Align public standard endpoint controllers (`mb-v1`, `mbrss-v1`) with the renamed query parameter and SQL filter path.
5. Update request helper types/builders in shared client packages to send/expect `minimumAmountMinor`.
6. Keep pagination totals coherent under threshold filters (`total`, `totalPages`) when SQL filter is active.

## Key Files
- `apps/api/src/lib/message-threshold-filter.ts`
- `apps/api/src/controllers/bucketMessagesController.ts`
- `apps/api/src/controllers/mbV1Controller.ts`
- `apps/api/src/controllers/mbrssV1Controller.ts`
- `apps/management-api/src/controllers/bucketMessagesController.ts`
- `packages/orm/src/services/BucketMessageService.ts`
- `packages/helpers-requests/src/web/buckets.ts`
- `packages/helpers-requests/src/types/bucket-types.ts`

## Verification
- No API list/read threshold path requires fetching all candidate rows into memory first.
- `minimumAmountMinor` is accepted; `minimumAmountUsdCents` is removed from runtime query handling.
- Threshold filtering remains deterministic and pagination metadata remains correct.
