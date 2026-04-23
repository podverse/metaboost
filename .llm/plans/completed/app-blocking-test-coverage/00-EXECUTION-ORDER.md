# Execution Order

## Phase 1 (sequential)

Run these plans in order. Each builds on the previous.

1. **01-allowed-baseline.md** -- Establish that unblocked apps can POST successfully. This must pass before blocking tests are meaningful.
2. **02-global-block-enforcement.md** -- Global block POST rejection and unblock roundtrip.
3. **03-bucket-block-enforcement.md** -- Bucket block POST on child, unblock roundtrip.
4. **04-registry-status-enforcement.md** -- Revoked registry status rejection.

After all plans are complete, run the full API integration test suite to confirm no regressions:

```bash
./scripts/nix/with-env npm run test -w apps/api -- src/test/bucket-blocked-apps.test.ts
```
