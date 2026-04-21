# Metaboost security remediation (LLM history)

## Session 1 - 2026-04-21

#### Prompt (Developer)

@metaboost/.llm/plans/completed/metaboost-security-remediation/COPY-PASTA.md:11-12 

Execute `.llm/plans/completed/metaboost-security-remediation/01-cors-fail-fast-and-auth-limiter-parity.md` exactly as written.  

Implement the changes and tests described there, then report results and residual risks.

#### Key Decisions

- Enforced non-empty `API_CORS_ORIGINS` / `MANAGEMENT_API_CORS_ORIGINS` at startup whenever `NODE_ENV` is neither `development` nor `test`, via shared helper `parseCorsOriginsWithStartupEnforcement` in `@metaboost/helpers`.
- Added moderate auth rate limits to API `POST /auth/refresh`, `POST /auth/logout`, and management-api `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/change-password` (aligned with existing `@metaboost/helpers-backend-api` factories; limits remain disabled in `NODE_ENV=test`).
- Added unit tests for CORS enforcement in `@metaboost/helpers` (avoids requiring Postgres for this check). Root `npm test` runs helpers tests first.

#### Files Modified

- `packages/helpers/src/startup/cors-and-cookies.ts`
- `packages/helpers/src/index.ts`
- `packages/helpers/src/startup/cors-and-cookies.test.ts`
- `packages/helpers/vitest.config.ts`
- `packages/helpers/tsconfig.json`
- `packages/helpers/package.json`
- `apps/api/src/config/index.ts`
- `apps/api/src/routes/auth.ts`
- `apps/api/src/middleware/rateLimit.ts`
- `apps/management-api/src/config/index.ts`
- `apps/management-api/src/routes/auth.ts`
- `apps/management-api/src/middleware/rateLimit.ts`
- `docs/development/ENV-REFERENCE.md`
- `package.json` (root test script order)

## Session 2 - 2026-04-21

#### Prompt (Developer)

@metaboost/.llm/plans/completed/metaboost-security-remediation/COPY-PASTA.md:16-17 

Execute `.llm/plans/completed/metaboost-security-remediation/02-return-url-validation-web-management-web.md` exactly as written.  

Implement the changes and tests described there, then report results and residual risks.

#### Key Decisions

- Centralized safe return navigation in `@metaboost/helpers` (`isSafeRelativeAppPath`, `resolveReturnUrlFromQuery`, `safeReturnPathOrFallback`, `isSafeLoginReturnUrl`).
- Server pages resolve `returnUrl` query through `resolveReturnUrlFromQuery` with deterministic fallback; client forms apply `safeReturnPathOrFallback` with explicit `fallbackNavigationHref`.
- Login page and web `loginRoute` / proxy aligned with shared helpers for consistent open-redirect mitigation.
- Added helpers unit tests and Playwright coverage on web + management-web role flows.

#### Files Modified

- `packages/helpers/src/returnUrl/safeReturnUrl.ts`
- `packages/helpers/src/returnUrl/safeReturnUrl.test.ts`
- `packages/helpers/src/index.ts`
- `apps/web/src/app/(auth)/login/page.tsx`
- `apps/web/src/lib/routes.ts`
- `apps/web/src/proxy.ts`
- `apps/web/src/app/(main)/bucket/[id]/BucketRoleFormClient.tsx`
- `apps/web/src/app/(main)/bucket/[id]/settings/roles/new/page.tsx`
- `apps/web/src/app/(main)/bucket/[id]/settings/roles/[roleId]/edit/page.tsx`
- `apps/web/e2e/bucket-role-new-bucket-owner.spec.ts`
- `apps/management-web/src/app/(main)/admins/roles/new/page.tsx`
- `apps/management-web/src/components/admins/AdminRoleForm.tsx`
- `apps/management-web/src/app/(main)/bucket/[id]/settings/roles/new/page.tsx`
- `apps/management-web/src/app/(main)/bucket/[id]/settings/roles/[roleId]/edit/page.tsx`
- `apps/management-web/src/app/(main)/bucket/[id]/settings/roles/BucketRoleFormClient.tsx`
- `apps/management-web/e2e/admin-role-new-super-admin-full-crud.spec.ts`
- `apps/management-web/e2e/bucket-role-new-super-admin-full-crud.spec.ts`

## Session 3 - 2026-04-21

#### Prompt (Developer)

@metaboost/.llm/plans/completed/metaboost-security-remediation/COPY-PASTA.md:25-27

Execute `.llm/plans/completed/metaboost-security-remediation/03-rss-ssrf-network-guards.md` exactly as written.  
Implement the changes and tests described there, then report rollout considerations and any compatibility impacts.

#### Key Decisions

- Centralized RSS outbound safety in `apps/api/src/lib/rss-safe-fetch.ts` (DNS + `BlockList` policy, manual redirects with re-validation, body read cap, `User-Agent` and timeout via `fetchRssFeedXmlWithTimeout`).
- `config.rssFeedMaxBodyBytes` from optional `API_RSS_FEED_MAX_BODY_BYTES` (default 3 MiB, bounds 1000–50_000_000).
- Documented `API_RSS_FEED_MAX_BODY_BYTES` in `docs/development/ENV-REFERENCE.md`.
- `fetchRssFeedXmlWithTimeout` delegates outbound enablement to `fetchRssFeedText` so `assertRssOutboundFetchEnabled` runs once per fetch.

#### Files Modified

- `apps/api/src/lib/rss-safe-fetch.ts`
- `apps/api/src/config/index.ts`
- `apps/api/src/lib/rss-sync.ts`
- `apps/api/src/controllers/bucketsController.ts`
- `apps/api/src/test/rss-safe-fetch.test.ts` (destination policy, body limit, redirect SSRF chain, redirect cap)
- `docs/development/ENV-REFERENCE.md`

## Session 4 - 2026-04-21

#### Prompt (Developer)

@metaboost/.llm/plans/completed/metaboost-security-remediation/COPY-PASTA.md:34-35

Execute `.llm/plans/completed/metaboost-security-remediation/04-auth-token-transport-and-management-proxy-session-gate.md` exactly as written.  
Implement the changes and tests described there, then report results and residual risks.

#### Key Decisions

- **API**: `POST /auth/verify-email` and `POST /auth/confirm-email-change` require `token` in the JSON body (`validateBody` + Joi); query-string tokens are rejected (mitigates referrer/log leakage). OpenAPI updated with `required` request bodies and descriptions.
- **management-web proxy**: Session restore aligned with `apps/web/src/proxy.ts`: `/auth/me` success parses user and sets `x-auth-user`; `/auth/me` 401 then `/auth/refresh` failure clears cookies and marks session invalidated; `hasSession` requires `!sessionInvalidated`; protected routes redirect to `/login` and append cookie clears when invalidated.
- **Shared parser**: `parseManagementMeEnvelope` and `ManagementSessionUser` live in `management-me-envelope.ts`; used by proxy and `getServerUser()`.
- **Tests**: Extended `auth-mailer.test.ts` for body-only validation; added `e2e/auth-stale-cookies-redirect-login.spec.ts` and order file entry; fixed `rss-safe-fetch` test fetch mock typing for `tsc`.

#### Files Modified

- `apps/api/src/controllers/authController.ts`
- `apps/api/src/routes/auth.ts`
- `apps/api/src/openapi.ts`
- `apps/api/src/test/auth-mailer.test.ts`
- `apps/api/src/test/rss-safe-fetch.test.ts` (TypeScript-only)
- `apps/management-web/src/proxy.ts`
- `apps/management-web/src/lib/server-auth.ts`
- `apps/management-web/src/lib/management-me-envelope.ts` (new)
- `apps/management-web/e2e/auth-stale-cookies-redirect-login.spec.ts` (new)
- `makefiles/local/e2e-spec-order-management-web.txt`
- `packages/helpers-requests/src/types/request-types.ts`

## Session 5 - 2026-04-21

#### Prompt (Developer)

@metaboost/.llm/plans/completed/metaboost-security-remediation/COPY-PASTA.md:43-44

Execute `.llm/plans/completed/metaboost-security-remediation/05-standard-endpoint-and-dependency-trust-hardening.md` exactly as written.
Implement the changes and tests described there, then report rollout sequencing and operational prerequisites.

#### Key Decisions

- **Management API parity**: optional **`MANAGEMENT_API_JWT_ISSUER`** / **`MANAGEMENT_API_JWT_AUDIENCE`**, **`signManagementAccessToken`** / **`verifyManagementToken`** / **`requireManagementAuth`** aligned with main API JWT claim behavior; Valkey-backed auth rate limits when **`MANAGEMENT_API_AUTH_RATE_LIMIT_USE_VALKEY=true`** (prefix **`rl:management-api:auth:`**).
- **Management startup validation**: registry hostname allowlist (**`STANDARD_ENDPOINT_REGISTRY_EXTRA_HOSTS`**), unsafe **`STANDARD_ENDPOINT_TRUST_PROXY`** + **`STANDARD_ENDPOINT_REQUIRE_HTTPS`** combo (same as API), optional JWT and Valkey rate-limit flag validation entries.
- **API**: exported **`validateStandardEndpointRegistryHostAllowlist`**, **`validateExchangeRatesProviderHostAllowlists`**, **`validateStandardEndpointTrustProxyTopology`** for focused unit tests; additions to **`startup-validation-standard-endpoint-policy.test.ts`** and **`jwt.claims.test.ts`**.
- **Docs**: **`ENV-REFERENCE.md`** entries for registry/exchange extras, unsafe trust-proxy note, JWT iss/aud, **`API_AUTH_RATE_LIMIT_USE_VALKEY`**, **`MANAGEMENT_API_AUTH_RATE_LIMIT_USE_VALKEY`**.

#### Files Modified

- `apps/management-api/src/config/index.ts`
- `apps/management-api/src/controllers/authController.ts`
- `apps/management-api/src/middleware/requireManagementAuth.ts`
- `apps/management-api/src/middleware/rateLimit.ts`
- `apps/management-api/src/lib/startup/validation.ts`
- `apps/management-api/src/lib/auth/jwt.ts`
- `apps/management-api/src/test/startup-validation-standard-endpoint-policy.test.ts`
- `apps/api/src/lib/startup/validation.ts`
- `apps/api/src/lib/auth/jwt.ts`
- `apps/api/src/middleware/rateLimit.ts`
- `apps/api/src/test/startup-validation-standard-endpoint-policy.test.ts`
- `apps/api/src/lib/auth/jwt.claims.test.ts`
- `docs/development/ENV-REFERENCE.md`
- `.llm/history/active/metaboost-security-remediation/metaboost-security-remediation-part-01.md`

## Session 6 - 2026-04-21

#### Prompt (Developer)

@metaboost/.llm/plans/completed/metaboost-security-remediation/COPY-PASTA.md:52-53

Execute `.llm/plans/completed/metaboost-security-remediation/06-regression-guards-and-security-test-backfill.md` exactly as written.
Implement the regression protections, complete verification, and provide a finding-to-fix closure matrix.

#### Key Decisions

- **Contributor/reviewer guardrails**: added `docs/development/SECURITY-REVIEW-CHECKLIST.md` and `docs/development/SECURITY-FINDINGS-CLOSURE-MATRIX.md`; linked from **AGENTS.md**.
- **Automated checks**: **`npm run security:check`** runs SQL dynamic-fragment scan + RSS outbound wiring verification; wired into **`npm run lint`** and **`make validate_ci`** (via Makefile.local.test.mk).
- **Test backfill**: CORS helper test for missing **`API_CORS_ORIGINS`** in production-like **`NODE_ENV`**; route source tests for auth rate-limit wiring (API + management-api).

#### Files Modified

- `docs/development/SECURITY-REVIEW-CHECKLIST.md`
- `docs/development/SECURITY-FINDINGS-CLOSURE-MATRIX.md`
- `scripts/security/check-sql-dynamic-fragments.mjs`
- `scripts/security/verify-rss-outbound-wiring.mjs`
- `package.json`
- `makefiles/local/Makefile.local.test.mk`
- `AGENTS.md`
- `packages/helpers/src/startup/cors-and-cookies.test.ts`
- `apps/api/src/test/auth-route-rate-limit-wiring.test.ts`
- `apps/management-api/src/test/auth-route-rate-limit-wiring.test.ts`
- `.llm/plans/completed/metaboost-security-remediation/COPY-PASTA.md`
- `.llm/history/active/metaboost-security-remediation/metaboost-security-remediation-part-01.md`

## Session 7 - 2026-04-21

#### Prompt (Developer)

Implement plan “Move completed active plan sets to `completed/`”: relocate Metaboost security remediation plans from `active/` into `completed/`, Podverse Wave 1 likewise, refresh path references.

#### Key Decisions

- Moved `.llm/plans/active/metaboost-security-remediation/*` (plans 01–05, `00-*`, `COPY-PASTA`) into `.llm/plans/completed/metaboost-security-remediation/` beside plan 06; removed empty active directory.
- Updated `.llm/plans/completed/metaboost-security-remediation/COPY-PASTA.md` and `00-EXECUTION-ORDER.md` to use `completed/` paths; refreshed metaboost LLM history path strings pointing at plan files.
- Podverse: moved `.llm/plans/active/podverse-security-remediation-wave-1` → `.llm/plans/completed/podverse-security-remediation-wave-1/` (COPY-PASTA and tracker already referenced `completed`).

#### Files Modified

- `.llm/plans/completed/metaboost-security-remediation/` (incoming files + path edits)
- `.llm/plans/completed/podverse-security-remediation-wave-1/` (directory location)
- `.llm/history/active/metaboost-security-remediation/metaboost-security-remediation-part-01.md`
- `.llm/history/active/security-audit-metaboost/security-audit-metaboost-part-01.md`
