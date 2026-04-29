# Security review checklist (contributors & reviewers)

Use this list for PRs that touch auth, HTTP boundaries, SQL, redirects, or outbound fetches. It mirrors the regression-guard section of the consolidated security audit ([06-FINAL-SECURITY-REVIEW-REPORT.md](../../.llm/plans/completed/metaboost-security-audit/06-FINAL-SECURITY-REVIEW-REPORT.md)).

## Auth, CORS, cookies, tokens

- **CORS allowlists**: In non-local environments (`NODE_ENV` not `development` or `test`), **`API_CORS_ORIGINS`** and **`MANAGEMENT_API_CORS_ORIGINS`** must be non-empty after trim. Behavior is enforced by `parseCorsOriginsWithStartupEnforcement` in `@metaboost/helpers` at config load (see [`packages/helpers/src/startup/cors-and-cookies.ts`](../../packages/helpers/src/startup/cors-and-cookies.ts)).
- **Sensitive routes**: Routes under **`{API_VERSION_PATH}/standard/*`** intentionally use permissive CORS for integrators; they must **not** return session secrets or authenticated-user-only data without separate checks.
- **Tokens in URLs**: Do not accept verification or reset tokens from query strings unless an explicitly approved exception exists; prefer JSON body (see auth controller patterns).
- **JWT**: Signing and verification must use the same per-service secret (`API_JWT_SECRET` / `MANAGEMENT_API_JWT_SECRET`) and preserve expiration handling; middleware must continue validating both `sub` and `id_text` against loaded users.

## SSRF and outbound trust boundary

- **User-influenced RSS / HTTP URLs**: All RSS XML fetches for user-supplied feed URLs must go through **`fetchRssFeedXmlWithTimeout`** / **`fetchRssFeedText`** from [`apps/api/src/lib/rss-safe-fetch.ts`](../../apps/api/src/lib/rss-safe-fetch.ts) (DNS/IP policy, redirects, body limits). Automated wiring is checked by **`npm run security:check`**.
- **Exchange / registry**: Provider and registry URLs must stay within startup hostname allowlists (see **`ENV-REFERENCE.md`** — `API_EXCHANGE_RATES_EXTRA_HOSTS`, `STANDARD_ENDPOINT_REGISTRY_EXTRA_HOSTS`).
- **Trust proxy**: **`STANDARD_ENDPOINT_TRUST_PROXY=true`** must not be combined with **`STANDARD_ENDPOINT_REQUIRE_HTTPS=false`** at startup; document ingress guarantees when enabling trust-proxy.

## Redirect and header trust (web / management-web)

- **`returnUrl` / `cancelUrl`**: Resolve through **`resolveReturnUrlFromQuery`**, **`safeReturnPathOrFallback`**, or **`isSafeRelativeAppPath`** from `@metaboost/helpers` — never pass raw query strings into **`router.push`**, **`redirect()`**, or **`window.location`**.
- **`x-auth-user`**: In Next proxies, inbound client **`x-auth-user`** must be stripped before internal session restore; trusted values are set only after successful `/auth/me` or refresh handling (see [`apps/web/src/proxy.ts`](../../apps/web/src/proxy.ts), [`apps/management-web/src/proxy.ts`](../../apps/management-web/src/proxy.ts)).

## SQL and query builders

- **Dynamic SQL fragments**: Avoid interpolating untrusted strings into **`where` / `andWhere` / `orderBy` / `groupBy` / `having`** raw SQL. Prefer parameters (`:name`) and allowlisted literals.
- **Known controlled interpolation**: If you must embed a bounded enum in SQL (e.g. `date_trunc`), keep the type as a **string union** or explicit allowlist at the API boundary and document the callsite.
- **Automated drift check**: **`npm run security:check`** runs a fragment scan over ORM/API sources; allowlisted patterns are documented in [`scripts/security/check-sql-dynamic-fragments.mjs`](../../scripts/security/check-sql-dynamic-fragments.mjs).

## Rate limiting

- **Auth-adjacent routes**: Login/signup flows use strict limiters; **`POST /auth/refresh`**, **`POST /auth/logout`**, and similar management routes use moderate limiters (see route modules). PRs that add auth routes should attach the appropriate limiter from [`@metaboost/helpers-backend-api`](../../packages/helpers-backend-api/src/rateLimit.ts).

## Verification commands

From repo root (after [`docs/CURSOR-NIX-WITH-ENV.md`](../CURSOR-NIX-WITH-ENV.md) if needed):

```bash
npm run security:check
make validate_ci
```

See **[SECURITY-FINDINGS-CLOSURE-MATRIX.md](SECURITY-FINDINGS-CLOSURE-MATRIX.md)** for mapping audit finding IDs to remediations and tests.
