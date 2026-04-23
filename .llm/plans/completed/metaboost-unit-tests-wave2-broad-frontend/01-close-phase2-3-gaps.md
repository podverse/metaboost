# Phase A - Close Phase 2/3 Gaps

## Scope

- Add mocked unit tests for [`apps/api/src/lib/valkey/replayStore.ts`](/Users/mitcheldowney/repos/pv/metaboost/apps/api/src/lib/valkey/replayStore.ts) (`tryRegisterAppAssertionNonce`, TTL clamping, replay detection).
- Extend [`apps/api/src/lib/bucket-effective.test.ts`](/Users/mitcheldowney/repos/pv/metaboost/apps/api/src/lib/bucket-effective.test.ts): UUID path when `findByShortId` misses and `findById` returns null.
- Extend [`apps/management-api/src/lib/bucket-effective.test.ts`](/Users/mitcheldowney/repos/pv/metaboost/apps/management-api/src/lib/bucket-effective.test.ts): same for management resolution.

## Verification

- `./scripts/nix/with-env npm run test -w apps/api`
- `./scripts/nix/with-env npm run test -w apps/management-api`
