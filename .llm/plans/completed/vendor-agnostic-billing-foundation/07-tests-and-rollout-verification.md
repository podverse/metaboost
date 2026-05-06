# 07 — Tests and Rollout Verification (Metaboost)

## Scope

- Consolidate acceptance gates across schema, services, API, and management UI.
- Prevent rollout with partial billing contracts or cross-domain drift.

## Steps

1. Add/update integration tests for billing service behavior.
   - idempotent extension calls
   - renewal due-window selection
   - retry/backoff behavior and event logging expectations
2. Add/update API integration tests for:
   - product membership resolved payloads
   - billing read-model access control and response contracts
   - management pricing governance authorization boundaries
3. Add/update E2E tests for management pricing and membership-product pages.
4. Add rollout checklist to ensure:
   - migration ordering safety
   - bootstrap idempotency
   - permissions and role mapping are validated
5. Confirm non-goal boundaries:
   - no feed/parser/lifecycle/object-storage work included
   - no broad unrelated management-web refactors included

## Key files to touch later

- `apps/api/src/test/`
- `apps/management-api/src/test/`
- `apps/management-web/e2e/`
- `infra/k8s/base/ops/source/database/linear-migrations/`
- `.llm/plans/active/vendor-agnostic-billing-foundation/`

## Verification

- All acceptance tests pass for billing scope.
- Permissions and audit behavior are covered by tests.
- Rollout checklist is complete and references each implemented phase.
- Phase cannot be marked complete if any earlier phase contract is missing.
