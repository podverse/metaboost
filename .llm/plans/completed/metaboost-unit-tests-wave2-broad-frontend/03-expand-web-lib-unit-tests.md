# Phase C - Expand Web Lib Unit Tests

## Scope

Add 3–6 focused `*.test.ts` files under [`apps/web/src/lib/`](/Users/mitcheldowney/repos/pv/metaboost/apps/web/src/lib/) for pure or mostly-pure logic:

- [`auth-user.ts`](/Users/mitcheldowney/repos/pv/metaboost/apps/web/src/lib/auth-user.ts) — `parseAuthUser`, `parseAuthEnvelope`, `parseAuthUserHeaderJson`
- [`routes.ts`](/Users/mitcheldowney/repos/pv/metaboost/apps/web/src/lib/routes.ts) — `parseBucketPath`, `isPublicPath`, `bucketPathFromAncestry`
- [`server-request.ts`](/Users/mitcheldowney/repos/pv/metaboost/apps/web/src/lib/server-request.ts) — `parseFilterColumns` (delegates to `@metaboost/helpers`)

Avoid component snapshots; mock Next/`server-only` boundaries only where unavoidable.

## Verification

- `./scripts/nix/with-env npm run test -w @metaboost/web`
