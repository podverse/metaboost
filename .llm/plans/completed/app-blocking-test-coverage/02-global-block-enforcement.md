# Plan 02: Global Block Enforcement

## Scope

Verify that globally blocking an app prevents POST boost messages across all buckets, and that removing the global block restores access.

## Steps

1. In `apps/api/src/test/bucket-blocked-apps.test.ts`, add tests in a `describe('global block enforcement')` block:

   a. **Global block blocks mb-v1 POST**: After `GlobalBlockedAppService.addOrUpdate(APP_ID, 'test ban')`, POST a valid boost to `POST /v1/standard/mb-v1/boost/${rootBucketShortId}` with signed JWT. Assert 403 with `code: 'app_global_blocked'`.

   b. **Global block pre-check confirms**: GET `/v1/standard/mb-v1/boost/${rootBucketShortId}?app_id=${APP_ID}` returns `app_allowed: false, app_block_reason: 'app_global_blocked'`.

   c. **Global block blocks mbrss-v1 POST**: POST a valid boost to the mbrss-v1 endpoint. Assert 403 with `code: 'app_global_blocked'`.

   d. **Remove global block**: `GlobalBlockedAppService.deleteByAppId(APP_ID)`.

   e. **App re-allowed after global unblock**: POST to mb-v1 again. Assert 201 with `message_guid`.

2. The test must clean up the global block in `afterAll` or at the end of the test to avoid interfering with other tests.

## Key files

- `apps/api/src/test/bucket-blocked-apps.test.ts` -- Add tests here
- `packages/orm/src/services/GlobalBlockedAppService.ts` -- `addOrUpdate()`, `deleteByAppId()`

## Verification

```bash
./scripts/nix/with-env npm run test -w apps/api -- src/test/bucket-blocked-apps.test.ts
```
