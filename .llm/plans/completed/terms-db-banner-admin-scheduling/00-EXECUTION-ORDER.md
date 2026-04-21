# Execution Order

## Phase 1 (Sequential)

1. [01-data-model-and-constraints.md](01-data-model-and-constraints.md)
2. [02-api-and-management-api.md](02-api-and-management-api.md)

Reason: API contracts and policy logic depend on the new DB model and constraints.

## Phase 2 (Parallel after Phase 1)

- [03-web-banner-and-terms-page.md](03-web-banner-and-terms-page.md)
- [04-management-web-admin-tools.md](04-management-web-admin-tools.md)

Reason: Web user UX and admin UX can proceed concurrently once API contracts are stable.

## Phase 3 (Sequential Finalization)

1. [05-testing-and-rollout.md](05-testing-and-rollout.md)

Reason: Consolidated verification, migration safety checks, and rollout runbook updates require all implementation work complete.
