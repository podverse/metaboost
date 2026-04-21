# Metaboost Security Audit Plan Set

## Scope

Comprehensive security review of `metaboost` with primary focus on:

- SQL injection risks in API and ORM query paths.
- Other clear attack surfaces (auth/session, CORS/cookies, outbound fetch/SSRF, token handling, open redirects, rate limiting, IDOR/mass assignment, PII leakage).

This plan set is intentionally split because full codebase review is too large for one pass.

## Plan Files

- `01-sql-query-inventory-and-triage.md`
- `02-sql-dataflow-verification.md`
- `03-non-sql-auth-session-cors.md`
- `04-non-sql-outbound-requests-and-ssrf.md`
- `05-web-management-surface-review.md`
- `06-joint-findings-remediation-and-regression-guards.md`

## Initial Hotspot Map

Primary SQL-sensitive files:

- `packages/orm/src/services/BucketService.ts`
- `packages/orm/src/services/BucketMessageService.ts`
- `apps/management-api/src/controllers/usersController.ts`
- `packages/management-orm/src/services/ManagementEventService.ts`
- `packages/management-orm/src/services/ManagementUserService.ts`
- `apps/api/src/lib/recompute-threshold-snapshots.ts`
- `apps/management-api/src/lib/recompute-threshold-snapshots.ts`

Primary non-SQL-sensitive files:

- `apps/api/src/app.ts`
- `apps/api/src/config/index.ts`
- `apps/api/src/controllers/authController.ts`
- `apps/api/src/controllers/bucketsController.ts`
- `apps/api/src/lib/rss-sync.ts`
- `apps/api/src/lib/rss-outbound.ts`
- `apps/api/src/routes/standardEndpoint.ts`
- `apps/api/src/lib/appAssertion/verifyAppAssertion.ts`
- `apps/web/src/proxy.ts`
- `apps/web/src/lib/server-auth.ts`
- `apps/management-api/src/app.ts`
- `packages/helpers-backend-api/src/rateLimit.ts`

## Dependencies Between Plans

- `01` must finish before `02`.
- `03`, `04`, and `05` can run in parallel after `02` begins (or after `01` if staffing allows), but all must complete before `06`.
- `06` is the final synthesis/remediation phase.

## Deliverables

Each plan produces:

- Evidence-based findings with severity and exploitability.
- File-level references and concrete proof-of-risk reasoning.
- Recommended fix list and regression protections.

Final output from plan `06` must include:

- Prioritized vulnerability list.
- Confirmed safe patterns already in place.
- Minimal, targeted remediation roadmap.
