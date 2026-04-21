# 04 - Bucket Settings UI and Types

## Scope
Expose threshold configuration in top-level bucket settings and propagate contracts across APIs and apps.

## Steps
1. Add API schema fields:
   - `minimumMessageUsdCents` to bucket update schemas in `apps/api` and `apps/management-api`.
2. Update server response serializers:
   - Include threshold in bucket response JSON helpers.
3. Update request/response shared types:
   - `Bucket` / `UpdateBucketBody` types in `packages/helpers-requests`.
4. Update web and management-web forms:
   - Add numeric threshold field in bucket general settings forms.
   - Keep existing apply-to-descendants confirmation pattern.
5. Enforce top-level behavior in UI:
   - Setting is edited from top-level bucket settings.
   - Descendant views consume effective threshold via API behavior.
6. Add copy/help text clarifying cents semantics (`1` = $0.01, `100` = $1.00).

## Key Files
- `apps/api/src/schemas/buckets.ts`
- `apps/management-api/src/schemas/buckets.ts`
- `apps/api/src/lib/bucket-response.ts`
- `apps/management-api/src/lib/bucketToJson.ts`
- `packages/helpers-requests/src/types/bucket-types.ts`
- `packages/helpers-requests/src/web/buckets.ts`
- `packages/helpers-requests/src/management-web/buckets.ts`
- `apps/web/src/app/(main)/buckets/BucketForm.tsx`
- `apps/management-web/src/components/buckets/BucketForm.tsx`

## Verification
- Bucket settings page saves threshold without type errors.
- GET bucket responses include threshold for rendering/editing.
- Existing settings fields and workflows continue to work.
