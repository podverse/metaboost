# Plan 04: Registry Status Enforcement

## Scope

Verify that an app with `revoked` registry status is rejected on POST for both mb-v1 and mbrss-v1 endpoints. The `suspended` status is already tested in `app-assertion-verification.test.ts`, but `revoked` and the full POST flow through both standard endpoint types are not.

## Steps

1. In `apps/api/src/test/bucket-blocked-apps.test.ts`, add tests in a `describe('registry status enforcement')` block:

   a. **Replace mock registry with revoked status**: Create a new `AppRegistryService` with a mock fetch that returns the same app record but with `status: 'revoked'`. Call `setAppRegistryServiceForTests()` with the new instance.

   b. **Revoked app rejected on mb-v1 POST**: POST a valid boost to `POST /v1/standard/mb-v1/boost/${rootBucketShortId}` with signed JWT where `iss` matches the revoked app. Assert 403 with `errorCode: 'app_suspended'` (the middleware returns `app_suspended` for both suspended and revoked).

   c. **Revoked app pre-check**: GET `/v1/standard/mb-v1/boost/${rootBucketShortId}?app_id=${APP_ID}` returns `app_allowed: false, app_block_reason: 'app_registry_blocked'`. Note: the pre-check uses `evaluateAppPostingPolicy` which returns `app_registry_blocked` for suspended/revoked, while the assertion middleware returns `app_suspended`.

   d. **Revoked app rejected on mbrss-v1 POST**: POST to mbrss-v1. Assert 403.

   e. **Restore active registry**: Reset the mock registry back to `status: 'active'` via `setAppRegistryServiceForTests()` so subsequent tests are not affected.

2. If the test is in the same file and `afterAll` restores the registry, ensure the revoked test restores the active status before returning.

## Key files

- `apps/api/src/test/bucket-blocked-apps.test.ts` -- Add tests here
- `apps/api/src/lib/appRegistry/AppRegistryService.ts` -- Mock pattern
- `apps/api/src/lib/appRegistry/singleton.ts` -- `setAppRegistryServiceForTests()`
- `apps/api/src/lib/appAssertion/verifyAppAssertion.ts` -- Returns `app_suspended` for revoked
- `apps/api/src/lib/app-block-policy.ts` -- Returns `app_registry_blocked` for revoked in pre-check

## Verification

```bash
./scripts/nix/with-env npm run test -w apps/api -- src/test/bucket-blocked-apps.test.ts
```
