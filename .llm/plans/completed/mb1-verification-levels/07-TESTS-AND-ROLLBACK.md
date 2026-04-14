# 07 - Tests and Rollback

## Scope

Validate new verification behavior across APIs and UIs, then define rollback-safe release steps.

## API integration tests (Metaboost)

Primary file:

- `/Users/mitcheldowney/repos/pv/metaboost/apps/api/src/test/mb1-spec-contract.test.ts`

Add matrix coverage for:

- `fully-verified`
- `verified-largest-recipient-succeeded`
- `partially-verified`
- `not-verified`

And filtering thresholds:

- default threshold returns levels 1-2 only
- include `partially-verified` widens to levels 1-3
- include `not-verified` widens to all levels

## Web E2E tests (Metaboost)

Update and/or add:

- `apps/web/e2e/bucket-rss-messages-unverified-toggle-bucket-owner.spec.ts`
- `apps/web/e2e/bucket-rss-messages-unverified-toggle-bucket-admin.spec.ts`
- `apps/web/e2e/bucket-rss-messages-non-admin.spec.ts`
- add new verification-state/expand-details specs as needed

Required assertions:

- icon mapping for each verification state
- default threshold behavior
- include options widen hierarchically
- expanded details display recipient outcome data

## Management-web E2E tests

Update:

- `apps/management-web/e2e/bucket-messages-super-admin-full-crud.spec.ts`
- `apps/management-web/e2e/bucket-messages-admin-with-buckets-read-bucket-admins-permission.spec.ts`
- plus role-restricted visibility specs for new controls

## Podverse verification tests

- Add tests around confirm payload assembly and recipient outcome mapping.
- Add compatibility tests for legacy fallback logic if mixed deployments are supported.

## Rollout and rollback

1. Deploy DB changes first (backward-compatible schema).
2. Deploy API with dual-read compatibility for legacy records.
3. Deploy web/management-web UI updates.
4. Deploy Podverse signaling updates.
5. Remove/deprecate legacy binary verification handling after stability window.

Rollback strategy:

- Keep legacy field support during transition.
- Feature-flag new filters/UI controls if needed.
- Revert API/UI first while retaining additive DB columns.
