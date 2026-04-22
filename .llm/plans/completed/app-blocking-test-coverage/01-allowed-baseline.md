# Plan 01: Allowed Baseline

## Scope

Verify that an unblocked, active-registry app can successfully POST boost messages via both mb-v1 and mbrss-v1 endpoints. This establishes the baseline that blocking tests will later invalidate.

## Steps

1. In `apps/api/src/test/bucket-blocked-apps.test.ts`, add a new `describe('allowed baseline')` block (or add tests to the existing describe) that:

   a. Uses the existing `beforeAll` setup (mock registry with active app, Ed25519 key pair, root + child bucket).

   b. **mb-v1 allowed POST**: POST a valid boost to `POST /v1/standard/mb-v1/boost/${rootBucketShortId}` with a signed AppAssertion JWT. Assert 201 and `message_guid` is a string.

   c. **mbrss-v1 setup**: Create an RSS channel bucket (using `BucketService` and `BucketRSSChannelInfoService`) in the `beforeAll` or in a dedicated before block.

   d. **mbrss-v1 allowed POST**: POST a valid boost to `POST /v1/standard/mbrss-v1/boost/${rssChannelBucketShortId}` with required `feed_guid` field. Assert 201 and `message_guid` is a string.

   e. **Pre-check allowed**: GET `/v1/standard/mb-v1/boost/${rootBucketShortId}?app_id=${APP_ID}` returns `app_allowed: true` with no `app_block_reason`.

## Key files

- `apps/api/src/test/bucket-blocked-apps.test.ts` -- Add tests here
- `apps/api/src/test/helpers/appAssertionSign.ts` -- Existing signing helper
- `apps/api/src/test/mbrss-v1-spec-contract.test.ts` -- Reference for mbrss-v1 POST setup (RSS channel bucket creation pattern)

## Verification

```bash
./scripts/nix/with-env npm run test -w apps/api -- src/test/bucket-blocked-apps.test.ts
```

All existing tests plus new baseline tests pass.
