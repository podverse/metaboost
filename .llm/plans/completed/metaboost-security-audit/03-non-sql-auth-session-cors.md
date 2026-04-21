# 03 - Non-SQL Auth, Session, CORS, and Token Review

## Scope

Review authentication/session attack surface and cross-origin policy behavior in API and management API.

## Steps

1. Trace login, refresh, logout, and protected route flows.
2. Verify cookie security settings (`HttpOnly`, `Secure`, `SameSite`, `Domain`, expiry, scope).
3. Audit CORS behavior across env paths:
   - default policy
   - public standards policy
   - empty/unset CORS env handling
4. Review verification/reset/email-change token lifecycle:
   - generation and storage
   - hash-at-rest
   - single-use behavior
   - body vs query transport
5. Check rate-limit coverage and consistency between API and management API.

## Key Files

- `apps/api/src/app.ts`
- `apps/api/src/config/index.ts`
- `apps/api/src/controllers/authController.ts`
- `apps/api/src/middleware/requireAuth.ts`
- `apps/api/src/lib/auth/cookies.ts`
- `apps/api/src/lib/auth/jwt.ts`
- `apps/api/src/routes/auth.ts`
- `apps/management-api/src/app.ts`
- `apps/management-api/src/routes/auth.ts`
- `packages/helpers/src/startup/cors-and-cookies.ts`
- `packages/helpers-backend-api/src/rateLimit.ts`

## Output

- `Auth/session/CORS findings report` with:
  - misconfiguration risks
  - abuse scenarios
  - parity gaps between API and management API
  - recommended hardening steps

## Verification

- All auth lifecycle endpoints are covered.
- CORS behavior is described for production-safe and fallback configurations.
- Token exposure paths (including query usage) are explicitly assessed.
