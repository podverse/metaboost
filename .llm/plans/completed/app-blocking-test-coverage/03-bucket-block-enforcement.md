# Plan 03: Bucket Block Enforcement

## Scope

Verify that blocking an app at the root bucket level prevents POST boost messages to both the root and child buckets, and that removing the bucket block restores access.

## Steps

1. In `apps/api/src/test/bucket-blocked-apps.test.ts`, add tests in a `describe('bucket block enforcement')` block:

   a. **Block app at root bucket**: POST `/v1/buckets/${rootBucketId}/blocked-apps` with `{ appId: APP_ID, appNameSnapshot: 'Test App' }`. Assert 201.

   b. **Bucket block blocks mb-v1 POST to child**: POST a valid boost to `POST /v1/standard/mb-v1/boost/${childBucketShortId}` with signed JWT. Assert 403 with `code: 'app_bucket_blocked'`. This verifies the block propagates from root to child.

   c. **Bucket block blocks mb-v1 POST to root**: POST to root. Assert 403 with `code: 'app_bucket_blocked'`.

   d. **Pre-check on child confirms bucket block**: GET `/v1/standard/mb-v1/boost/${childBucketShortId}?app_id=${APP_ID}` returns `app_allowed: false, app_block_reason: 'app_bucket_blocked'`.

   e. **Bucket block blocks mbrss-v1 POST**: POST to mbrss-v1 endpoint (using RSS channel bucket under the same root). Assert 403 with `code: 'app_bucket_blocked'`.

   f. **Remove bucket block**: DELETE `/v1/buckets/${rootBucketId}/blocked-apps/${blockedAppRowId}`. Assert 204.

   g. **App re-allowed after bucket unblock**: POST to mb-v1 again. Assert 201 with `message_guid`.

## Key files

- `apps/api/src/test/bucket-blocked-apps.test.ts` -- Add tests here
- `packages/orm/src/services/BucketBlockedAppService.ts` -- `add()`, `deleteByIdAndRoot()`
- `apps/api/src/lib/blocked-app-scope.ts` -- Root bucket resolution

## Verification

```bash
./scripts/nix/with-env npm run test -w apps/api -- src/test/bucket-blocked-apps.test.ts
```
