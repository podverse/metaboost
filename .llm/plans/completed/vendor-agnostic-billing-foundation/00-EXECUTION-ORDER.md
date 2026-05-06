# Execution order — Vendor-Agnostic Billing Foundation (Metaboost)

**Status: all phases completed** (see numbered files in this directory).

## Phase order (completed)

1. [02-pricing-catalog-and-schema.md](./02-pricing-catalog-and-schema.md) (completed)
2. [04-membership-settings-bootstrap.md](./04-membership-settings-bootstrap.md) (completed)
3. [03-services-api-and-orchestration.md](./03-services-api-and-orchestration.md) (completed)
4. [06-public-api-billing-read-models.md](./06-public-api-billing-read-models.md) (completed)
5. [05-management-pricing-governance.md](./05-management-pricing-governance.md) (completed)
6. [07-tests-and-rollout-verification.md](./07-tests-and-rollout-verification.md) (completed)

## Also

- Summary: [00-SUMMARY.md](./00-SUMMARY.md)
- Domain period policy: [01-domain-and-period-policy.md](./01-domain-and-period-policy.md)
- Rollout gates: [ROLLOUT-CHECKLIST.md](./ROLLOUT-CHECKLIST.md)

## Why this order

- Completed: domain period policy — see [01-domain-and-period-policy.md](./01-domain-and-period-policy.md).
- Completed: pricing catalog and schema — see [02-pricing-catalog-and-schema.md](./02-pricing-catalog-and-schema.md).
- Completed: membership settings bootstrap — see [04-membership-settings-bootstrap.md](./04-membership-settings-bootstrap.md).
- Completed: services, API, and orchestration — see [03-services-api-and-orchestration.md](./03-services-api-and-orchestration.md).
- Completed: public API billing read models — see [06-public-api-billing-read-models.md](./06-public-api-billing-read-models.md).
- Service and orchestration logic follows once policy and schema contracts are stable.
- Public read-model contracts are defined before management UI so client payloads are stable.
- Management pricing governance and billing-adjacent UI work comes after API contracts.
- Verification and rollout checks run last as a gated completion phase.
