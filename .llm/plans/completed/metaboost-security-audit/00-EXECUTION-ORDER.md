# Execution Order

## Phase 1 - SQL Baseline (Sequential)

1. Run `01-sql-query-inventory-and-triage.md`.
2. Run `02-sql-dataflow-verification.md`.

Rationale: `02` depends on complete query inventory and template contract from `01`.

## Phase 2 - Non-SQL Attack Surface (Parallel Allowed)

After Phase 1:

- Run `03-non-sql-auth-session-cors.md`.
- Run `04-non-sql-outbound-requests-and-ssrf.md`.
- Run `05-web-management-surface-review.md`.

These can run in parallel because they focus on mostly separate subtrees.

## Phase 3 - Synthesis and Fix Plan (Sequential)

After all Phase 2 plans complete:

1. Run `06-joint-findings-remediation-and-regression-guards.md`.

Rationale: this phase consolidates all findings and defines final remediation order.

## Parallel Safety Notes

- Do not run `06` until `01` through `05` are complete.
- If two plan executions touch the same output artifact, merge results only during `06`.
- Keep findings evidence-first (path and symbol references), then severity, then recommendation.
