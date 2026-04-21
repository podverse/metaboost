# 04 - Management parity and regression guards

## Scope

Ensure management surfaces do not silently assume RSS-only bucket types.

## Key files

- `apps/management-api/src/test/management-buckets-messages.test.ts`
- `apps/management-api/src/controllers/bucketMessagesController.ts`
- `apps/management-web/` bucket-related UI and type usage (as needed)
- `packages/helpers-requests/src/types/bucket-types.ts` (reference for shared unions)

## Steps

1. Audit management-api message/listing code paths for bucket-type filters or assumptions.
2. Add tests in `management-buckets-messages.test.ts` (or companion test file) covering `mb-root` / `mb-mid` / `mb-leaf` visibility and filtering expectations.
3. Audit management-web for bucket-type unions and rendering branches that may omit `mb-*` types.
4. Add/adjust management-web tests (or at minimum type-safe compile/runtime assertions) so future regressions are caught.

## Verification

- Targeted management-api tests pass with mb bucket cases.
- management-web checks pass with no type or runtime branch omissions for `mb-*`.
