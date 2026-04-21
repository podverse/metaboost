# 01 - CORS Fail-Fast and Auth Limiter Parity

## Priority

- Severity: High + Medium
- Rollout risk: Medium
- Bucket: P0

## Scope

Remediate:

- H1: CORS fallback permissiveness when allowlist env is unset.
- M4: Missing rate-limiter coverage/parity on auth-adjacent routes.

## Steps

1. Enforce non-local CORS allowlist requirement for both APIs.
   - Fail startup if CORS origin list is missing/empty outside local/dev modes.
2. Keep explicit local/dev behavior that allows permissive CORS only when intentionally configured.
3. Add missing auth route limiters:
   - API: `/refresh`, `/logout`
   - management-api: `/refresh`, `/logout`, `/change-password`
4. Keep limiter thresholds practical to avoid user friction; align patterns with existing auth limiters.
5. Update environment/config docs describing required CORS vars by environment.

## Key Files

- `apps/api/src/app.ts`
- `apps/api/src/config/index.ts`
- `apps/api/src/routes/auth.ts`
- `apps/management-api/src/app.ts`
- `apps/management-api/src/config/index.ts`
- `apps/management-api/src/routes/auth.ts`
- `packages/helpers/src/startup/cors-and-cookies.ts`
- `packages/helpers-backend-api/src/rateLimit.ts`
- Relevant env/doc files for API and management-api startup configuration

## Verification

1. Add/update integration tests (API + management-api):
   - startup/config behavior for missing CORS allowlist in non-local mode;
   - auth limiter presence on newly covered routes.
2. Run targeted API and management-api integration test suites.
3. Validate local/dev startup still works with intended explicit permissive mode.
4. Confirm no regression in existing auth flows (`login`, `refresh`, `logout`, `change-password`).

## Deliverable

- CORS behavior is explicit and fail-fast in non-local environments.
- Auth rate-limit coverage parity is enforced for both APIs.
