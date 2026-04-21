# Metaboost Security Remediation - Summary

## Source

- `.llm/plans/completed/metaboost-security-audit/06-FINAL-SECURITY-REVIEW-REPORT.md`

## Goal

Remediate confirmed vulnerabilities and highest-value hardening items from the completed security audit, prioritized by:

1. severity (high before medium/low),
2. rollout risk (lower-risk remediations first within same severity),
3. exploit-path reduction per unit of implementation effort.

## Prioritization Model

- **P0**: High severity + low/medium rollout risk
- **P1**: High severity + medium/high rollout risk (needs tighter verification and rollout controls)
- **P2**: Medium severity + low/medium rollout risk
- **P3**: Structural hardening and long-tail risk reduction

## Plan Files

1. `01-cors-fail-fast-and-auth-limiter-parity.md` (P0)
2. `02-return-url-validation-web-management-web.md` (P2, low rollout risk quick win)
3. `03-rss-ssrf-network-guards.md` (P1)
4. `04-auth-token-transport-and-management-proxy-session-gate.md` (P2)
5. `05-standard-endpoint-and-dependency-trust-hardening.md` (P3)
6. `06-regression-guards-and-security-test-backfill.md` (P3, closes loop)

## Dependency Map

- `01` and `02` can run in parallel after baseline branch prep.
- `03` should run after `01` so config guardrails are already in place.
- `04` can run after `02` (shared auth/session and frontend routing context).
- `05` should run after `03` and `04` because it codifies trust-boundary and operational controls.
- `06` runs last to enforce regression protections and audit-complete verification.

## Remediation Scope

- API and management-api CORS and auth-rate limiting gaps.
- Web and management-web redirect safety (`returnUrl`) and session-gate correctness.
- RSS outbound SSRF protections and safe-fetch policy.
- Auth token transport hardening for verification flows.
- Standard endpoint trust-proxy/dependency trust hardening.
- Lint/test/checklist guardrails to prevent reintroduction.

## Out of Scope

- New vulnerability discovery outside the completed audit.
- Major auth model redesign not required for currently confirmed findings.
- Non-security product feature work.
