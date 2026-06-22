# Summary — Vendor-Agnostic Billing Foundation (Metaboost)

## Objective

Create a future-focused billing foundation for Metaboost that standardizes month-safe renewal
math, moves pricing source-of-truth to DB, and adds non-vendor-specific renewal and extension
workflows.

## Scope of this plan set

- Premium membership is the first purchasable product.
- Schema and services must support additional purchasable products without redesign.
- Monthly renewal uses calendar-month clamp semantics.
- Auto-renew attempts are due in the near-expiry window (within 24 hours).
- Billing-adjacent management UI is included only where required for pricing governance.
- Documentation and naming remain future-focused and product-neutral.

## Explicit non-goals

- Feed status replacement and feed lifecycle migrations.
- Parser, archiver, and RSS policy migrations.
- Unrelated object storage and worker-secret work.
- Broad management-web refactors outside billing/pricing pages.

## Planned outputs

- Centralized period policy module for month/year extension behavior.
- Billing product + pricing tables with audit-friendly history.
- Membership settings storage with idempotent env bootstrap behavior.
- Billing domain event log and renewal retry/backoff metadata contracts.
- Vendor-agnostic billing domain service contracts and extension APIs.
- Near-expiry renewal orchestrator with idempotent attempt handling.
- Public and authenticated API billing read models usable by web and future app clients.
- Management pricing governance API and billing-focused management-web flows.
- Integration and E2E verification gates for all billing contracts.

## Plan files

1. [01-domain-and-period-policy.md](./01-domain-and-period-policy.md) (completed)
2. [02-pricing-catalog-and-schema.md](./02-pricing-catalog-and-schema.md) (completed)
3. [04-membership-settings-bootstrap.md](./04-membership-settings-bootstrap.md) (completed)
4. [03-services-api-and-orchestration.md](./03-services-api-and-orchestration.md) (completed)
5. [06-public-api-billing-read-models.md](./06-public-api-billing-read-models.md) (completed)
6. [05-management-pricing-governance.md](./05-management-pricing-governance.md) (completed)
7. [07-tests-and-rollout-verification.md](./07-tests-and-rollout-verification.md) (completed)
