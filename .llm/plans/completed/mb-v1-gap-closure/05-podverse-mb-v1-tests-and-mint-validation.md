# 05 - Podverse mb-v1 tests and mint validation

## Scope

Harden Podverse mb-v1 behavior with targeted tests and explicit mint-path validation.

## Key files

- `podverse/packages/v4v-metaboost/src/metaBoostStandard.ts`
- `podverse/packages/v4v-metaboost/src/mbV1CreateBoost.ts`
- `podverse/apps/web/src/components/Boost/hooks/useBoostPayments.ts`
- `podverse/apps/web/src/components/Boost/payments/mbV1/mbV1RequestMetadata.ts`
- Podverse test directories for `v4v-metaboost` and boost hooks

## Steps

1. Add unit tests for `resolveBoostExecutionStrategy`:
   - explicit `standard: 'mb-v1'`
   - node URL containing `/standard/mb-v1/`
   - fallback/mbrss behavior unchanged
2. Add unit tests for `buildMbV1CreateBoostRequest`:
   - required fields
   - stream vs boost message behavior
   - positive amount enforcement
3. Add tests around `useBoostPayments` mb-v1 branch behavior:
   - uses mb-v1 post function when strategy resolves to mb-v1
   - preserves existing mbrss/fallback behavior
4. Validate and test the mint-app-assertion flow for mb-v1 ingest URLs even though the request helper is mbrss-named.

## Verification

- Targeted Podverse tests pass for strategy, request builder, and hook behavior.
- No regressions in existing mbrss-v1 tests/snapshots.
