# 11 - Cross-Repo Rollout Validation

> **Status:** **Completed.** Deliverables: [STANDARD-ENDPOINT-ROLLOUT-RUNBOOK.md](../../../../docs/api/STANDARD-ENDPOINT-ROLLOUT-RUNBOOK.md), [STANDARD-ENDPOINT-POST-ROLLOUT-VALIDATION-REPORT-TEMPLATE.md](../../../../docs/api/STANDARD-ENDPOINT-POST-ROLLOUT-VALIDATION-REPORT-TEMPLATE.md). Completion recorded in [COPY-PASTA.md](./COPY-PASTA.md) Phase 7.

## Scope

Define final integration validation, rollout sequencing, compatibility checks, and rollback criteria across Metaboost and Metaboost Registry for the npm-helper approach.

**Out of scope:** Podverse monorepo implementation and E2E — those are covered by plan **12**; this plan may reference gate **10** (npm publish verified) for integrators but does not duplicate Podverse work.

## Outcomes

- Rollout can be executed in controlled stages.
- Breakage risks are identified before production cutover.
- Rollback is documented and testable.

## Steps

1. Define staged rollout gates:
   - Phase 0 decision-lock approval complete;
   - registry readiness;
   - signing helpers package readiness (**public npm** verified per plan **10** before consumer repos depend on it);
   - Metaboost verification readiness;
   - developer docs and consumer example readiness.
2. Define compatibility matrix:
   - signed request required behavior only (hard-enforce);
   - invalid/malformed signature behavior;
   - active vs suspended app records;
   - HTTPS vs insecure transport behavior.
3. Define end-to-end smoke checklist:
   - register app;
   - integrate helpers in a sample backend;
   - sign and post to `/v1/standard/*` from sample backend;
   - confirm expected API response and stored message behavior.
4. Define observability checks:
   - request logs for app id and decision outcomes;
   - error rate thresholds for auth failures;
   - registry fetch health metrics.
5. Define rollback strategy:
   - configuration rollback where possible;
   - helper package version rollback;
   - verifier enforcement rollback path.
6. Define release communication checklist for integrators.

## Phase Completion Checks

- Phase 0 -> Phase 1:
  - decision locks are written as concrete, approved values.
- Phase 1 -> Phase 2:
  - registry schema and contributor docs are complete and validated;
  - `validate-registry` GitHub Actions check is required for PR merges and confirmed working.
- Phase 2 -> Phase 3:
  - helper package API surface and distribution workflow are complete.
- Phase 3 -> Phase 4:
  - verifier behavior, defaults, and HTTPS enforcement are complete.
- Phase 4 -> Phase 5:
  - onboarding docs and consumer examples are complete.
- Phase 5 -> Production cutover:
  - rollout runbook and validation report template are complete.

## Deliverables

- Rollout runbook document in Metaboost docs.
- Post-rollout validation report template.

## Suggested Files

- [`docs/api/STANDARD-ENDPOINT-ROLLOUT-RUNBOOK.md`](../../../../docs/api/STANDARD-ENDPOINT-ROLLOUT-RUNBOOK.md)
- [`docs/api/STANDARD-ENDPOINT-INTEGRATION-GUIDE.md`](../../../../docs/api/STANDARD-ENDPOINT-INTEGRATION-GUIDE.md) (cross-links updated to runbook + report template)
- [`packages/`](../../../../packages/)

## Verification

- Dry-run checklist can be executed in non-production environment end-to-end.
- Each phase has clear go/no-go criteria.
- Rollback steps are validated at least once before production cutover.
- Each phase transition includes explicit completion confirmation in the plan set.
- Registry PR merge path is blocked when validation CI fails and unblocked when it passes.

## Implementation Notes

- Keep acceptance criteria measurable and binary.
- Keep scope focused on registry, helper package, and Metaboost verification.
