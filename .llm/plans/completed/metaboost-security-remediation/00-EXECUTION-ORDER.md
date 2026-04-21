# Metaboost Security Remediation - Execution Order

## Phase 0 - Baseline

- Confirm the source report is unchanged:
  - `.llm/plans/completed/metaboost-security-audit/06-FINAL-SECURITY-REVIEW-REPORT.md`
- Create branch for remediation work.
- Align test strategy for API integration tests and web/management-web E2E tests.

## Phase 1 - Immediate Risk Reduction (parallel)

- Run `01-cors-fail-fast-and-auth-limiter-parity.md`
- Run `02-return-url-validation-web-management-web.md`

These two plans target separate subsystems and can run in parallel.

## Phase 2 - High-Severity Outbound Hardening (sequential)

- Run `03-rss-ssrf-network-guards.md`

This step is high severity with higher rollout risk and requires focused validation.

## Phase 3 - Auth/Session Integrity Follow-up (sequential)

- Run `04-auth-token-transport-and-management-proxy-session-gate.md`

Do this after Phase 1 to reuse shared auth and route-safety patterns.

## Phase 4 - Trust-Boundary Structural Controls (sequential)

- Run `05-standard-endpoint-and-dependency-trust-hardening.md`

This phase hardens deployment and control-plane assumptions.

## Phase 5 - Regression Closure (sequential)

- Run `06-regression-guards-and-security-test-backfill.md`

Completes lint/test/review guardrails and final security verification.

## Completion Criteria

- All six numbered plans executed.
- No unresolved high-severity findings from the final security report.
- Targeted integration and E2E tests added/updated and passing.
- Plan set location: `.llm/plans/completed/metaboost-security-remediation`
