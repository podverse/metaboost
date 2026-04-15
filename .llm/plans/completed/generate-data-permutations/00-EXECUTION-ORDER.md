# Execution Order

## Phase 1 (Sequential)

1. `01-schema-and-entity-alignment.md`

Rationale: establish a safe baseline so generated rows match required schema/entity contracts.

## Phase 2 (Parallel)

Run in parallel after Phase 1 completes:

1. `02-main-db-permutation-seeding.md`
2. `03-management-db-permutation-seeding.md`

Rationale: these touch separate DB domains and can be developed independently.

## Phase 3 (Sequential)

1. `04-cli-config-and-ops-guardrails.md`

Rationale: CLI/runtime options should be wired after scenario builders are stable.

## Phase 4 (Sequential)

1. `05-verification-and-docs.md`

Rationale: finalize with validations, docs, and regression checks (including E2E seed isolation).
