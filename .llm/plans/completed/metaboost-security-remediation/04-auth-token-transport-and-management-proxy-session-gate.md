# 04 - Auth Token Transport and Management-Web Session Gate

## Priority

- Severity: Medium
- Rollout risk: Low-Medium
- Bucket: P2

## Scope

Remediate:

- M3: verification tokens accepted in query params.
- M5: management-web protected-route gate uses cookie presence instead of validated session.

## Steps

1. Update verification endpoints to prefer/require token submission via request body.
2. If compatibility window is required, define short-lived transitional behavior and explicit deprecation path.
3. Harden management-web proxy session gate:
   - require successful validation/restore outcome for protected route pass-through;
   - clear invalid/stale auth cookies when restore fails.
4. Align management-web behavior with proven web proxy invalid-session handling.
5. Review error messaging/redirect UX to avoid confusing auth loops.

## Key Files

- `apps/api/src/controllers/authController.ts`
- `apps/api/src/routes/auth.ts`
- `apps/management-web/src/proxy.ts`
- `apps/web/src/proxy.ts` (reference parity behavior)
- Any shared auth/session helper files used by proxies

## Verification

1. Add/update API integration tests:
   - verification endpoints with body token path;
   - explicit handling for deprecated query-token behavior (if retained temporarily).
2. Add/update management-web E2E tests:
   - invalid/stale session cookie cannot bypass protected-route gate;
   - proper redirect to login and cookie invalidation path.
3. Confirm successful auth flows remain functional.

## Deliverable

- Verification token transport is hardened and management-web route protection depends on validated session state.
