# COPY-PASTA Prompts

Execute each prompt in order. Wait for each to complete before starting the next.

---

## Phase 1, Step 1: Allowed Baseline

```
Implement plan file .llm/plans/active/app-blocking-test-coverage/01-allowed-baseline.md in the metaboost repo at /Users/mitcheldowney/repos/pv/metaboost. Add tests to apps/api/src/test/bucket-blocked-apps.test.ts that verify an unblocked, active-registry app can successfully POST boost messages via both mb-v1 and mbrss-v1 endpoints, and that the pre-check endpoint returns app_allowed: true. Follow the existing test patterns in that file (mock registry with Ed25519 keys, signAppAssertionForTests helper). Use RSS channel bucket setup patterns from mbrss-v1-spec-contract.test.ts. Run the test to confirm it passes.
```

## Phase 1, Step 2: Global Block Enforcement

```
Implement plan file .llm/plans/active/app-blocking-test-coverage/02-global-block-enforcement.md in the metaboost repo at /Users/mitcheldowney/repos/pv/metaboost. Add tests to apps/api/src/test/bucket-blocked-apps.test.ts that verify: global block prevents mb-v1 POST (403, app_global_blocked), global block prevents mbrss-v1 POST (403), pre-check confirms global block, and removing the global block restores app access (201). Use GlobalBlockedAppService.addOrUpdate/deleteByAppId. Clean up the global block after tests. Run the test to confirm it passes.
```

## Phase 1, Step 3: Bucket Block Enforcement

```
Implement plan file .llm/plans/active/app-blocking-test-coverage/03-bucket-block-enforcement.md in the metaboost repo at /Users/mitcheldowney/repos/pv/metaboost. Add tests to apps/api/src/test/bucket-blocked-apps.test.ts that verify: bucket block at root prevents mb-v1 POST to child bucket (403, app_bucket_blocked), bucket block prevents mb-v1 POST to root, pre-check on child confirms bucket block, bucket block prevents mbrss-v1 POST, and removing the bucket block restores access (201). Run the test to confirm it passes.
```

## Phase 1, Step 4: Registry Status Enforcement

```
Implement plan file .llm/plans/active/app-blocking-test-coverage/04-registry-status-enforcement.md in the metaboost repo at /Users/mitcheldowney/repos/pv/metaboost. Add tests to apps/api/src/test/bucket-blocked-apps.test.ts that verify: revoked registry status rejects mb-v1 POST (403), pre-check returns app_registry_blocked, revoked status rejects mbrss-v1 POST (403), and the active registry is restored after the test. Use setAppRegistryServiceForTests to swap the mock registry. Run the test to confirm it passes.
```

## Final: Full Test Run

```
Run the full API integration test file to confirm no regressions:

./scripts/nix/with-env npm run test -w apps/api -- src/test/bucket-blocked-apps.test.ts
```
