# 02 - API bucket policy matrix tests

## Scope

Cover the `mb-*` hierarchy and disjoint-family constraints with explicit, high-signal tests.

## Key files

- `apps/api/src/test/buckets.test.ts`
- `apps/api/src/controllers/bucketsController.ts` (read-only reference while adding tests)
- `packages/orm/src/services/BucketService.ts` (read-only reference while adding tests)

## Steps

1. Add positive-path tests for Custom hierarchy:
   - create top-level `mb-root`
   - create `mb-mid` under `mb-root`
   - create `mb-leaf` under `mb-mid`
2. Add explicit rejection tests for invalid transitions:
   - `mb-mid` under `rss-*`
   - `mb-leaf` under `rss-*`
   - `rss-channel` under `mb-*`
   - `mb-leaf` under `mb-root`
   - `mb-mid` under `mb-mid`
3. Add payload validation tests for mb child creation:
   - required `name`
   - no `rssFeedUrl`-driven fallback behavior
4. Keep expected error messages/assertions stable and specific so regressions are obvious.

## Verification

- Targeted `buckets.test.ts` cases pass for all added matrix scenarios.
- Existing RSS child creation behavior remains unchanged.
