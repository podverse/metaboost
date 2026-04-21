# Final Security Review Report (Plans 01-05)

## Executive Summary

- SQL track outcome: **no currently confirmed, clearly exploitable SQL injection path** was found in runtime code (evidence: Plans 01-02).
- Most material confirmed vulnerabilities are non-SQL:
  - permissive CORS fallback behavior when allowlists are absent,
  - user-influenced outbound RSS fetch SSRF surface,
  - unvalidated `returnUrl` redirect sinks in role workflows.
- Multiple medium/low findings are hardening opportunities that reduce exploit chainability and operational risk.

## Confirmed Vulnerabilities vs Hardening Recommendations

- **Confirmed vulnerabilities**
  - H1, H2, M1, M2, M3, M4, M5 (listed below with exploit scenarios and fixes).
- **Hardening recommendations (not confirmed direct exploit in current state)**
  - M6, L1, L2, L3, plus SQL drift guard around `date_trunc`.

## Severity-Ranked Findings

## Critical

- None confirmed.

## High

### H1) CORS fallback permits broad origin reflection if allowlist env is unset

- Evidence (Plan 03): `03-AUTH-SESSION-CORS-FINDINGS-REPORT.md`
- Exploit scenario: deployment starts without CORS allowlist env; attacker origin can make credentialed browser requests due to permissive fallback.
- Impacted files/symbols:
  - `apps/api/src/app.ts` (`origin: config.corsOrigins ?? true`, `credentials: true`)
  - `apps/management-api/src/app.ts` (`origin: config.corsOrigins ?? true`, `credentials: true`)
  - `packages/helpers/src/startup/cors-and-cookies.ts` (`parseCorsOrigins`)
- Recommended fix:
  - fail startup in non-local env when CORS allowlist is missing/empty;
  - keep permissive mode only for explicit local/dev profile.
- Blast radius:
  - all browser clients of API and management API in affected environment.
- Rollout risk:
  - medium (deployment/config coordination required; may break environments currently relying on implicit permissive behavior).

### H2) RSS URL fetch path lacks explicit SSRF network controls

- Evidence (Plan 04): `04-OUTBOUND-SSRF-TRUST-BOUNDARY-REPORT.md`
- Exploit scenario: attacker supplies feed URL resolving to internal/private network or metadata target; server fetches attacker-influenced destination.
- Impacted files/symbols:
  - `apps/api/src/controllers/bucketsController.ts` (`parseRssChannelFromFeedUrl`)
  - `apps/api/src/lib/rss-sync.ts` (`fetchNormalizedRss`)
  - `apps/api/src/lib/rss-outbound.ts` (outbound fetch helper behavior)
- Recommended fix:
  - central outbound URL safety validator (DNS/IP checks, private/link-local/loopback/metadata deny);
  - controlled redirect policy;
  - max response-size/read limits for XML feed reads.
- Blast radius:
  - API outbound network trust boundary; potential internal service exposure.
- Rollout risk:
  - medium-high (some existing feeds or redirects may be blocked and need allowlist tuning).

## Medium

### M1) Unvalidated `returnUrl` navigation sink in role flows (web + management-web)

- Evidence (Plan 05): `05-WEB-MANAGEMENT-SURFACE-FINDINGS-REPORT.md`
- Exploit scenario: authenticated user opens crafted link with attacker-controlled `returnUrl`; after submit/cancel user is redirected externally.
- Impacted files/symbols:
  - `apps/management-web/src/components/admins/AdminRoleForm.tsx` (`router.push(returnUrl/cancelUrl)`)
  - `apps/management-web/src/app/(main)/bucket/[id]/settings/roles/BucketRoleFormClient.tsx` (`window.location.href = successHref`)
  - `apps/web/src/app/(main)/bucket/[id]/settings/roles/BucketRoleFormClient.tsx` (equivalent sink)
  - related role new/edit pages that forward query `returnUrl`.
- Recommended fix:
  - shared `isSafeReturnUrl` validator at sink points;
  - same-origin relative paths only;
  - fallback to deterministic safe route when invalid.
- Blast radius:
  - authenticated users in role-management flows.
- Rollout risk:
  - low-medium (UX changes for previously accepted external return targets).

### M2) HTTPS requirement for Standard Endpoint can be bypassed under trust-proxy misconfiguration

- Evidence (Plan 04)
- Exploit scenario: trust-proxy enabled outside controlled ingress path; attacker can spoof forwarded proto and satisfy HTTPS check.
- Impacted files/symbols:
  - `apps/api/src/middleware/requireHttpsForStandardEndpoints.ts`
  - `apps/api/src/lib/standardEndpoint/httpsScheme.ts`
  - env `STANDARD_ENDPOINT_TRUST_PROXY`
- Recommended fix:
  - only enable trust-proxy in explicitly trusted network topology;
  - add startup/deploy guard checks for proxy header hygiene.
- Blast radius:
  - Standard Endpoint routes under misconfigured deployment.
- Rollout risk:
  - medium (environment-specific behavior changes).

### M3) Verification tokens accepted from query params

- Evidence (Plan 03)
- Exploit scenario: token leaks through logs/history/referrer when included in URL query.
- Impacted files/symbols:
  - `apps/api/src/controllers/authController.ts` (`verifyEmail`, `confirmEmailChange`)
- Recommended fix:
  - body-only token acceptance;
  - if temporary compatibility needed, short transition window with strict logging hygiene.
- Blast radius:
  - account verification/email-change flows.
- Rollout risk:
  - low-medium (client compatibility and migration sequencing).

### M4) Missing rate limiter coverage/parity on refresh/logout and management change-password

- Evidence (Plan 03)
- Exploit scenario: endpoint hammering for operational pressure/abuse where limiter not applied.
- Impacted files/symbols:
  - `apps/api/src/routes/auth.ts` (`/refresh`, `/logout`)
  - `apps/management-api/src/routes/auth.ts` (`/refresh`, `/logout`, `/change-password`)
- Recommended fix:
  - apply moderate per-IP+route limiters for refresh/logout;
  - parity limiter for management change-password.
- Blast radius:
  - auth-adjacent endpoint availability and abuse resistance.
- Rollout risk:
  - low (requires limiter threshold tuning to avoid false positives).

### M5) Management-web protected-route gate uses cookie presence, not validated session

- Evidence (Plan 05)
- Exploit scenario: attacker supplies fake/stale session cookie and bypasses proxy redirect logic to protected route shell.
- Impacted files/symbols:
  - `apps/management-web/src/proxy.ts` (`hasSession` logic and restore behavior)
- Recommended fix:
  - require validated session or successful restore before allowing protected route pass-through;
  - clear invalid cookies on failed restore.
- Blast radius:
  - management-web route gating and frontend trust assumptions.
- Rollout risk:
  - low-medium (could force additional login prompts if restore edge cases exist).

### M6) External registry/provider trust and availability is security-control-plane sensitive

- Evidence (Plan 04)
- Exploit scenario: registry/provider misconfig/outage changes policy behavior or causes deny/instability.
- Impacted files/symbols:
  - `apps/api/src/lib/appRegistry/AppRegistryService.ts`
  - `apps/api/src/config/standardEndpointRegistry.ts`
  - `apps/api/src/lib/exchangeRates.ts`
- Recommended fix:
  - pin allowed hostnames;
  - improve fallback/resilience and telemetry.
- Blast radius:
  - posting policy availability and external dependency trust boundary.
- Rollout risk:
  - medium (operational policy updates required).

## Low

### L1) Minimal JWT claim policy (`iss`/`aud` not enforced)

- Evidence (Plan 03)
- Impacted files/symbols:
  - `apps/api/src/lib/auth/jwt.ts`
  - `apps/management-api/src/lib/auth/jwt.ts`
- Recommendation:
  - add issuer/audience checks and token version strategy when multi-service scope expands.
- Blast radius:
  - future architecture hardening.
- Rollout risk:
  - medium (token issuance/validation compatibility).

### L2) In-memory rate-limit store default weak for distributed deployments

- Evidence (Plan 03)
- Impacted files/symbols:
  - `packages/helpers-backend-api/src/rateLimit.ts`
- Recommendation:
  - move to shared store (Valkey/Redis) in production.
- Blast radius:
  - global limiter consistency under scale.
- Rollout risk:
  - low-medium (infrastructure dependency).

### L3) `x-auth-user` header trust could be tightened

- Evidence (Plan 05)
- Impacted files/symbols:
  - `apps/web/src/lib/server-auth.ts`
  - `apps/management-web/src/lib/server-auth.ts`
- Recommendation:
  - strip inbound header and set trusted internal value only; optionally add integrity/signing over internal hop.
- Blast radius:
  - SSR auth-context trust boundary.
- Rollout risk:
  - low-medium (proxy integration updates).

## SQL Track Consolidation (Plans 01-02)

- Confirmed exploitability status:
  - `clearly exploitable`: none.
  - `potentially exploitable`: one future-drift pattern (`BucketMessageService` dynamic `date_trunc` string interpolation) if unsafe callers are introduced.
  - `not exploitable` (current): all reviewed hotspots.
- De-duplication note:
  - SQL items classified as hardening/drift guards and not merged into confirmed vulnerability list above.

## Prioritized Remediation Backlog

## Quick wins

1. Add centralized `returnUrl` safe-validation and apply to all role flow sinks.
2. Add missing auth endpoint rate limiters and management parity.
3. Enforce CORS allowlist presence in non-local startup configuration.

## Medium effort hardening

4. Implement RSS outbound safety helper (IP/redirect/size controls) and route all RSS fetches through it.
5. Require validated session (not cookie presence) in management-web proxy gate.
6. Move verification-token flows away from query parameters.

## Deeper architectural changes

7. Establish outbound host pinning + resilience policy for registry/provider dependencies.
8. Introduce JWT claim-policy hardening for multi-service readiness.
9. Adopt shared distributed rate-limit store for production.

## Regression-Guard Checklist

## Lint/check patterns

- SQL interpolation checks:
  - detect template SQL with `${...}` in `where/andWhere/orWhere/orderBy/groupBy/having/query`.
  - require allowlist mapping for dynamic sort/group fields.
- Outbound fetch checks:
  - enforce use of approved outbound URL validator for user-influenced URLs.

## Security review checklist

- Auth/CORS/token:
  - non-local CORS allowlists required and explicit;
  - public CORS routes must not return auth-sensitive data;
  - token-bearing URLs are disallowed unless explicitly exception-approved.
- SSRF/trust boundary:
  - private-network and metadata destination blocking confirmed for outbound user-influenced fetches;
  - trust-proxy enabled only with documented ingress guarantees.
- Web redirect/header:
  - every `returnUrl` sink validates destination;
  - inbound `x-auth-user` never treated as trusted user-supplied header.

## Targeted tests to add or strengthen

- CORS startup validation tests for missing/empty allowlists in non-local mode.
- Route tests for refresh/logout/change-password limiter behavior.
- SSRF protection tests:
  - reject private/link-local/loopback/metadata targets;
  - reject unsafe redirects;
  - enforce response size/read bounds.
- Web/management-web tests for return-url sanitization and fallback behavior.
- Management-web proxy tests asserting invalid session cookie does not grant protected-route pass-through.
- SQL regression tests/lint rules ensuring no user input is interpolated into SQL text.

## Implementation Sequencing

## Sequence 1 - quick wins

- CORS fail-fast configuration enforcement.
- Auth limiter parity updates.
- returnUrl validation in web + management-web role flows.

## Sequence 2 - medium hardening

- management-web proxy session-validation gate fix.
- verification token transport hardening.
- RSS outbound SSRF controls.

## Sequence 3 - deeper architecture

- outbound dependency host policy + resilience strategy.
- distributed rate-limiting store rollout.
- JWT claim-policy hardening rollout plan.

## Final Status

- Consolidation complete for plans 01 through 05.
- Findings de-duplicated and ranked (critical/high/medium/low).
- Confirmed vulnerabilities are separated from hardening recommendations.
- No remediation code changes were implemented in this step.
