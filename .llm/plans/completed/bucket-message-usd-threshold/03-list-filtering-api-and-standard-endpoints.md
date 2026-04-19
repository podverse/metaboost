# 03 - List Filtering (API and Standard Endpoints)

## Scope
Apply minimum-threshold filtering (USD cents basis) to:
- Bucket owner/admin list endpoints.
- Public standard list endpoints used by third-party apps.

## Steps
1. Add optional min-threshold query parsing for list endpoints:
   - Bucket list (`apps/api` and `apps/management-api`): `minimumAmountUsdCents` query param.
   - Standard public list (`mb-v1`, `mbrss-v1`): same optional query param.
2. Resolve top-level baseline threshold for any bucket scope:
   - Determine root bucket ID.
   - Load root bucket settings minimum threshold.
3. Compute effective threshold:
   - `effectiveMin = max(rootMinimumMessageUsdCents, requestMinimumAmountUsdCents ?? 0)`.
4. Extend ORM list/count query options:
   - Add `minimumUsdCents` option to `findByBucketIds` and `countByBucketIds`.
   - Add DB predicate on `value.usd_cents_at_create >= :minimumUsdCents`.
5. Define null-snapshot behavior:
   - Rows with `usd_cents_at_create IS NULL` are excluded when `effectiveMin > 0`.
   - Rows are included when `effectiveMin === 0`.
6. Keep blocked-sender and public-only filters intact.

## Key Files
- `packages/orm/src/services/BucketMessageService.ts`
- `apps/api/src/controllers/bucketMessagesController.ts`
- `apps/management-api/src/controllers/bucketMessagesController.ts`
- `apps/api/src/controllers/mbV1Controller.ts`
- `apps/api/src/controllers/mbrssV1Controller.ts`
- `packages/helpers/src/pagination/*` (if shared query parsing helpers are introduced)

## Verification
- List response shapes stay unchanged except filtered results.
- Count and page totals match filtered datasets.
- Same threshold semantics apply consistently across owner/admin and public standard endpoints.
