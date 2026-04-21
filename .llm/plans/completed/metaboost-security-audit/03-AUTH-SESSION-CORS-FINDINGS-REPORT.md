# Plan 03 Output - Auth/Session/CORS Findings Report

## Scope Reviewed

- `apps/api/src/app.ts`
- `apps/api/src/config/index.ts`
- `apps/api/src/controllers/authController.ts`
- `apps/api/src/middleware/requireAuth.ts`
- `apps/api/src/lib/auth/cookies.ts`
- `apps/api/src/lib/auth/jwt.ts`
- `apps/api/src/routes/auth.ts`
- `apps/management-api/src/app.ts`
- `apps/management-api/src/config/index.ts`
- `apps/management-api/src/controllers/authController.ts`
- `apps/management-api/src/middleware/requireManagementAuth.ts`
- `apps/management-api/src/lib/auth/cookies.ts`
- `apps/management-api/src/lib/auth/jwt.ts`
- `apps/management-api/src/routes/auth.ts`
- `packages/helpers/src/startup/cors-and-cookies.ts`
- `packages/helpers-backend-api/src/rateLimit.ts`

## Findings (Ordered by Severity)

### 1) High - CORS fallback permits broad origin reflection when allowlist env is unset

- **Evidence**
  - API: `apps/api/src/app.ts` uses `origin: config.corsOrigins ?? true` with `credentials: true`.
  - Management API: `apps/management-api/src/app.ts` uses `origin: config.corsOrigins ?? true` with `credentials: true`.
  - `parseCorsOrigins` returns `undefined` when env missing/empty (`packages/helpers/src/startup/cors-and-cookies.ts`), which triggers `?? true`.
- **Risk**
  - If production/staging CORS env vars are missing, APIs may reflect arbitrary origins.
  - Combined with credentialed requests this broadens cross-origin access surface and increases blast radius of frontend-origin compromise.
- **Recommendation**
  - Enforce explicit non-empty CORS origin lists in non-local environments and fail fast at startup when missing.
  - Keep `allow all` behavior only for explicitly local/dev modes.

### 2) Medium - Public standards CORS path uses permissive origin reflection with credentials

- **Evidence**
  - `apps/api/src/app.ts` selects `publicStandardsCors = cors({ origin: true, credentials: true })` for:
    - `/v1/standard/*`
    - `/v1/buckets/public/:id/conversion(-snapshot)`
- **Risk**
  - Intended public/browser-readable endpoints are open to cross-origin reads by design.
  - `credentials: true` is likely unnecessary for public data and creates avoidable coupling to browser credential behavior.
  - Future route additions under this path could accidentally inherit broad cross-origin readability.
- **Recommendation**
  - For these public endpoints, set `credentials: false` and keep payloads explicitly unauthenticated/public.
  - Add route-level guardrails/tests to ensure no auth-dependent data is ever returned on this CORS branch.

### 3) Medium - Verification tokens accepted via query params (URL exposure risk)

- **Evidence**
  - `apps/api/src/controllers/authController.ts`:
    - `verifyEmail`: token accepted from body OR query.
    - `confirmEmailChange`: token accepted from body OR query.
- **Risk**
  - Query tokens can leak through browser history, logs, reverse proxies, and referrer propagation.
  - Token hashing-at-rest is good, but transport-in-URL still broadens exposure channels.
- **Recommendation**
  - Prefer token submission in POST body only.
  - If query support remains for compatibility, convert to one-time POST exchange quickly and avoid logging query strings.

### 4) Medium - Refresh/logout auth endpoints are not rate-limited

- **Evidence**
  - `apps/api/src/routes/auth.ts`:
    - `/login`, `/signup`, verification/reset flows are limited.
    - `/refresh` and `/logout` have no limiter.
  - `apps/management-api/src/routes/auth.ts`:
    - `/login` limited.
    - `/refresh`, `/logout`, `/change-password` not limited.
- **Risk**
  - Increases abuse surface for endpoint hammering/operational DoS (especially under single-instance in-memory limiter defaults).
  - Not a direct auth bypass, but potentially significant availability risk.
- **Recommendation**
  - Add moderate per-IP+path limiters to refresh/logout.
  - Consider lightweight limiter for authenticated password-change routes as abuse protection.

### 5) Medium - Management API change-password route lacks parity limiter

- **Evidence**
  - `apps/management-api/src/routes/auth.ts` applies limiter only to `/login`.
  - Main API applies `moderateAuthRateLimiter` to `/change-password` (`apps/api/src/routes/auth.ts`).
- **Risk**
  - Creates inconsistent abuse resistance between APIs.
- **Recommendation**
  - Align management API with main API by adding moderate limiter on `/change-password` (and optionally `/me` patch).

### 6) Low - JWT verification uses minimal claims validation

- **Evidence**
  - `apps/api/src/lib/auth/jwt.ts` and `apps/management-api/src/lib/auth/jwt.ts` validate signature and `sub` (and username for management), but do not enforce `iss`, `aud`, `jti`, or token versioning claims.
- **Risk**
  - Current model is viable for same-service tokens but less robust for future multi-issuer/service expansion.
- **Recommendation**
  - If architecture expands, add explicit issuer/audience constraints and token-version invalidation strategy.

### 7) Low - Rate limiting uses in-memory store by default (horizontal scaling gap)

- **Evidence**
  - Shared limiter factory in `packages/helpers-backend-api/src/rateLimit.ts` supports external store but defaults to in-memory.
- **Risk**
  - Limits can be bypassed/distributed across replicas and do not survive restarts.
- **Recommendation**
  - Use shared store (e.g., Valkey/Redis) in production multi-instance deployments.

## Positive Controls Observed

- Session and refresh cookies are `HttpOnly`, `SameSite=lax`, and `Secure` in production (`apps/api/src/lib/auth/cookies.ts`, `apps/management-api/src/lib/auth/cookies.ts`).
- Refresh tokens and verification tokens are hashed before persistence and consumed/revoked server-side.
- Auth middleware prefers cookie token but supports Bearer fallback, and always resolves user from DB before authorization.
- Main API applies strict rate limiting to login/signup/reset/verification flows.

## Prioritized Hardening Recommendations

1. Make CORS allowlists mandatory in non-local environments (both APIs).
2. Remove `credentials: true` from explicitly public CORS routes unless required.
3. Add limiter coverage for `/refresh` and `/logout` (both APIs), plus management `/change-password`.
4. Move verification flows to body-only token handling (or minimize query-token lifetime/exposure).
5. Plan optional JWT claim hardening (`iss`/`aud`) for future service expansion.

## Open Questions / Assumptions

- Assumes deployment/ingress does not override app-level CORS behavior in ways that weaken restrictions.
- Assumes no sensitive authenticated data is intentionally served under `/standard/*` or public conversion routes.
- Assumes production env management can enforce required CORS variables reliably.

## Plan 03 Completion Checklist

- [x] Auth lifecycle endpoints reviewed (login, refresh, logout, me, profile, password, verification/reset).
- [x] Cookie/CORS/session settings reviewed in both API and management API.
- [x] Rate-limit coverage and parity reviewed.
- [x] Severity-ranked findings and hardening recommendations produced.
- [x] No code fixes implemented.
