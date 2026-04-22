# App Blocking Test Coverage - Summary

## Goal

Verify the three-tier app blocking feature works correctly and expand integration test coverage so we have confidence that apps are properly blocked or allowed across all scenarios.

## Three-tier blocking model

1. **Registry level**: App must exist with `status: 'active'` in the remote registry. `suspended` or `revoked` apps are rejected.
2. **Global level**: `global_blocked_app` table provides server-wide blocks managed by admins.
3. **Bucket level**: `bucket_blocked_app` table provides per-root-bucket hierarchy blocks.

## Current test gaps

The existing `bucket-blocked-apps.test.ts` covers:
- Bucket block pre-check (GET) returns `app_bucket_blocked`
- Bucket block POST returns 403 with `app_bucket_blocked`
- Global block pre-check (GET) returns `app_global_blocked`

Missing coverage:
- No baseline "allowed" test proving an unblocked app CAN post
- No global block POST rejection test (only pre-check)
- No mbrss-v1 endpoint coverage for blocking
- No revoked registry status test (only suspended tested in a different file)
- No unblock/re-allow roundtrip (block -> verify blocked -> unblock -> verify allowed)
- No child-bucket propagation for POST (only pre-check tests child)

## Plan files

| File | Scope |
|------|-------|
| `01-allowed-baseline.md` | Verify unblocked apps can successfully POST boosts via mb-v1 and mbrss-v1 |
| `02-global-block-enforcement.md` | Global block POST rejection + unblock roundtrip for mb-v1 and mbrss-v1 |
| `03-bucket-block-enforcement.md` | Bucket block POST on child bucket, unblock roundtrip for mb-v1 and mbrss-v1 |
| `04-registry-status-enforcement.md` | Revoked registry status rejection via POST for both endpoints |

## Key files

- `apps/api/src/test/bucket-blocked-apps.test.ts` - Main file to expand
- `apps/api/src/lib/app-block-policy.ts` - Core policy logic
- `apps/api/src/lib/blocked-app-scope.ts` - Bucket-level resolution
- `apps/api/src/controllers/mbV1Controller.ts` - mb-v1 handler
- `apps/api/src/controllers/mbrssV1Controller.ts` - mbrss-v1 handler
- `apps/api/src/test/helpers/appAssertionSign.ts` - Test signing helper

## No production code changes

All tests use the existing mock registry pattern (`setAppRegistryServiceForTests`). No test-only code paths or production changes are needed.
