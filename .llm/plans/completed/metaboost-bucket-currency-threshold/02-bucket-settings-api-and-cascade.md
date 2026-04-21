# 02 - Bucket Settings API and Cascade

## Scope
Expose and enforce preferred-currency threshold settings across bucket APIs with cascade behavior matching existing settings flow.

## Steps
1. Update API and management-api bucket update schemas:
   - `preferredCurrency`
   - `minimumMessageAmountMinor`
   - reuse `applyToDescendants` behavior.
2. Ensure descendants can override these settings directly (similar to message char limit behavior).
3. Ensure top-level edits can cascade these fields to descendants when requested.
4. Return new fields in all bucket GET/list responses used by apps.
5. Add conversion endpoint URL field in bucket responses (placeholder wiring in this step; final endpoint in step 04).
6. Define endpoint filtering contract: message-list/read endpoints must apply bucket threshold in preferred currency space (with conversion logic from step 03/04).

## Key Files
- `apps/api/src/schemas/buckets.ts`
- `apps/management-api/src/schemas/buckets.ts`
- `apps/api/src/controllers/bucketsController.ts`
- `apps/management-api/src/controllers/bucketsController.ts`
- `apps/api/src/lib/bucket-response.ts`
- `apps/management-api/src/lib/bucketToJson.ts`
- `packages/helpers-requests/src/types/bucket-types.ts`
- `packages/helpers-requests/src/web/buckets.ts`
- `packages/helpers-requests/src/management-web/buckets.ts`

## Verification
- API validation rejects unsupported currency codes and invalid threshold values.
- Top-level updates with `applyToDescendants=true` propagate both fields.
- Descendant bucket update works independently when not cascading.
- GET bucket returns threshold, preferred currency, and conversion URL fields.
