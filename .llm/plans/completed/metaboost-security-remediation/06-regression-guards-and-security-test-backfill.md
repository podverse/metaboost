# 06 - Regression Guards and Security Test Backfill

## Priority

- Severity: Cross-cutting
- Rollout risk: Low-Medium
- Bucket: P3 (closure)

## Scope

Institutionalize protections so remediated issues do not regress, including SQL safety drift prevention and review/test guardrails.

## Steps

1. Add code-review checklist updates for:
   - SQL interpolation risks,
   - CORS/auth/token handling,
   - SSRF-sensitive outbound fetch usage,
   - redirect sink and header trust patterns.
2. Add/strengthen automated checks or lint-like validation where feasible:
   - dangerous SQL template interpolation patterns;
   - requirement to use approved outbound URL validator for user-influenced fetches.
3. Backfill targeted tests listed in final report:
   - CORS startup validation tests,
   - auth limiter coverage tests,
   - RSS SSRF control tests,
   - return-url sanitization tests,
   - management-web session-gate correctness tests.
4. Produce remediation completion matrix mapping each finding ID (H1/H2/M1...L3) to:
   - code/config change,
   - test coverage,
   - residual risk note.
5. Final audit-close review and handoff documentation.

## Key Files

- `.llm/plans/completed/metaboost-security-audit/06-FINAL-SECURITY-REVIEW-REPORT.md` (source checklist)
- Security/contributor docs under `docs/` (review checklist location)
- Test suites and helper files touched by plans 01-05
- Any lint/check scripts or CI validation points used for security checks

## Verification

1. Confirm every finding in the final report has either:
   - a closed remediation, or
   - documented accepted risk with rationale.
2. Run targeted integration and E2E suites introduced in earlier plans.
3. Ensure CI includes new/updated security regression checks.

## Deliverable

- A complete remediation closure package with durable guardrails and explicit finding-to-fix traceability.
