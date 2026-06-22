# 05 - Tests and Verification (Metaboost)

## Scope

- Add API integration coverage.
- Add web E2E coverage.
- Verify manual behavior and local setup.

## API integration tests

1. Preference CRUD
   - read/update per-user bucket preference.
2. Apply-to-descendants behavior
   - this bucket only vs all sub-buckets.
3. Inheritance on child creation
   - manual child create.
   - RSS sync-created item bucket.
4. Webpush device CRUD
   - create/update/delete/list for authenticated user.
5. Dispatch behavior
   - new message triggers notification attempt.
   - below-threshold message does not trigger send.

## Web E2E tests

1. Bell icon visible on bucket page for authenticated user.
2. Toggle with no children applies immediately.
3. Toggle with children opens scope modal and both buttons work.
4. Page reload reflects persisted preference state.
5. Subscription lifecycle handles enable/disable transitions.

## Manual checks

1. Generate VAPID keys and wire env.
2. Enable notifications on parent with apply-to-all.
3. Create new child and confirm inherited preference.
4. Send qualifying and non-qualifying boosts and validate dispatch difference.

## Verification commands

```bash
./scripts/nix/with-env npm run build
./scripts/nix/with-env npm run lint
./scripts/nix/with-env npm run test:e2e:api
./scripts/nix/with-env make e2e_test_web
```

## Exit criteria

- API and web tests pass for the new notification behavior.
- Manual threshold and inheritance behavior matches requirements.
- Plan can be executed phase-by-phase without hidden dependencies.