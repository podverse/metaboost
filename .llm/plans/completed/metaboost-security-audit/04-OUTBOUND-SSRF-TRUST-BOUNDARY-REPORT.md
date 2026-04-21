# Plan 04 Output - Outbound/SSRF and Integrator Trust-Boundary Report

## Scope Reviewed

- `apps/api/src/controllers/bucketsController.ts`
- `apps/api/src/lib/rss-sync.ts`
- `apps/api/src/lib/rss-outbound.ts`
- `apps/api/src/lib/exchangeRates.ts`
- `apps/api/src/routes/standardEndpoint.ts`
- `apps/api/src/middleware/requireAppAssertion.ts`
- `apps/api/src/lib/appAssertion/verifyAppAssertion.ts`
- `apps/api/src/lib/appRegistry/AppRegistryService.ts`
- `apps/api/src/lib/appRegistry/singleton.ts`
- `apps/api/src/lib/standardEndpoint/httpsScheme.ts`
- `apps/api/src/middleware/requireHttpsForStandardEndpoints.ts`
- `apps/api/src/lib/valkey/replayStore.ts`
- `apps/api/src/config/standardEndpointRegistry.ts`
- `apps/api/src/config/index.ts`
- `apps/api/src/lib/startup/validation.ts`

## Endpoint/Surface Risk Ratings

| Surface | Primary Risk | Rating |
| --- | --- | --- |
| RSS feed fetch via `rssFeedUrl` (bucket create/verify/sync) | SSRF and outbound abuse | high |
| Exchange-rate outbound fetches (provider URLs) | env-driven outbound trust | medium |
| App registry fetches for Standard Endpoint app policy | availability/trust of remote registry | medium |
| Standard Endpoint HTTPS enforcement (`X-Forwarded-Proto` trust mode) | proxy misconfiguration bypass | medium |
| AppAssertion verification (signature, binding, replay checks) | trust-boundary integrity | low (strong controls observed) |

## Findings (Ordered by Severity)

### 1) High - User-influenced RSS feed URLs are fetched without network-level SSRF controls

- **Evidence**
  - `apps/api/src/controllers/bucketsController.ts`: `fetch(rssFeedUrl, ...)` in `parseRssChannelFromFeedUrl`.
  - `apps/api/src/lib/rss-sync.ts`: `fetch(rssFeedUrl, ...)` in `fetchNormalizedRss`.
  - URL validation in schemas restricts scheme to `http/https`, but there is no host/IP policy enforcement.
- **Exploit Preconditions**
  - Attacker can submit or control `rssFeedUrl` (directly or through privileged user workflow).
  - Outbound network from API pod/host can reach internal addresses/metadata endpoints.
- **Why this matters**
  - Scheme validation alone does not prevent access to RFC1918/internal IP space or DNS-rebinding targets.
  - Default `fetch` redirect behavior can follow redirects to sensitive internal targets.
  - Timeout is present, but there is no explicit response size cap for feed body.
- **Mitigation Options**
  - Add outbound URL guardrails:
    - deny private/link-local/loopback/metadata IPs (after DNS resolution and after redirects),
    - allowlist trusted host patterns where feasible.
  - Restrict redirect behavior (`redirect: 'manual'` or validated redirect chain).
  - Enforce max response size/read limit for XML.
  - Keep feature flag (`API_RSS_FEED_FETCH_ENABLED`) as coarse kill-switch, but pair with network policy.

### 2) Medium - Standard Endpoint HTTPS policy can be bypassed if trust-proxy setting is misconfigured

- **Evidence**
  - `apps/api/src/middleware/requireHttpsForStandardEndpoints.ts` uses scheme from `getEffectiveRequestScheme`.
  - `apps/api/src/lib/standardEndpoint/httpsScheme.ts` trusts `X-Forwarded-Proto` only when `STANDARD_ENDPOINT_TRUST_PROXY=true`.
- **Exploit Preconditions**
  - App is reachable directly (or via untrusted hop) where attacker can set `X-Forwarded-Proto`.
  - `STANDARD_ENDPOINT_TRUST_PROXY` enabled but ingress/proxy path is not tightly controlled.
- **Why this matters**
  - Misapplied trust-proxy allows spoofed forwarded proto to satisfy HTTPS requirement.
- **Mitigation Options**
  - Keep `STANDARD_ENDPOINT_TRUST_PROXY=false` unless traffic is exclusively through trusted TLS-terminating proxy.
  - Enforce network-level restriction so app is not directly internet-accessible when trust-proxy is on.
  - Add deployment/runbook checks validating proxy header hygiene before enabling trust mode.

### 3) Medium - App registry unavailability creates a high-leverage operational dependency for posting policy

- **Evidence**
  - `verifyAppAssertionForPostRequest` and `evaluateAppPostingPolicy` depend on `AppRegistryService.loadAppRecord`.
  - Registry fetch source defaults to GitHub raw URLs (`standardEndpointRegistry.ts`) and is env-overridable.
  - On unavailable registry and no cache, policy denies posting (`registry_unavailable`) and returns 503/403 depending path.
- **Exploit Preconditions**
  - Registry endpoint is unavailable, blocked, or misconfigured.
  - Cache is cold/stale and cannot satisfy requests.
- **Why this matters**
  - This is fail-closed for security (good), but makes posting availability dependent on remote registry availability.
  - Env compromise/misconfiguration could also redirect registry base URL to untrusted host.
- **Mitigation Options**
  - Pin and tightly control `STANDARD_ENDPOINT_REGISTRY_URL` in deployment management.
  - Consider stronger startup checks for registry reachability in production.
  - Consider signed local snapshot fallback for resilience if remote registry is unavailable.

### 4) Medium - Exchange-rate provider URLs are env-controlled outbound targets without host pinning

- **Evidence**
  - `apps/api/src/lib/exchangeRates.ts` performs `fetch(FIAT_RATES_URL)` and `fetch(buildBtcPriceUrlForFiatBase())`.
  - Provider URLs come from env (`API_EXCHANGE_RATES_*_PROVIDER_URL`) and are validated as HTTP/HTTPS URL format.
- **Exploit Preconditions**
  - Deployment env is misconfigured or compromised.
- **Why this matters**
  - Not direct user-input SSRF, but still an outbound trust surface that can be redirected to malicious/internal endpoints.
- **Mitigation Options**
  - Restrict allowed provider hostnames in startup validation.
  - Keep outbound egress policy constrained to intended providers.

### 5) Low - Replay protection depends on Valkey availability (security-availability coupling)

- **Evidence**
  - `verifyAppAssertionForPostRequest` registers nonce via `tryRegisterAppAssertionNonce` (`valkey` set NX with TTL).
  - If replay-store call fails unexpectedly, request handling errors and bubbles to 500 via middleware error path.
- **Exploit Preconditions**
  - Valkey outage or connectivity issue.
- **Why this matters**
  - Fails closed for replay checks (security-positive) but reduces request availability.
- **Mitigation Options**
  - Monitor replay-store health and add explicit degraded-mode telemetry.
  - Consider clearer 503 error response for replay-store dependency failures.

## Positive Controls Observed

- Standard Endpoint router enforces:
  - HTTPS gate (`requireHttpsForStandardEndpoints`) before Standard handlers,
  - AppAssertion on POST only (`requireAppAssertionForPost`).
- AppAssertion validation includes:
  - issuer extraction and registry lookup,
  - key-status filtering (`active` Ed25519/EdDSA),
  - signature verification and expiry checks,
  - strict method/path/body-hash binding,
  - jti replay lock with TTL.
- Registry record URL builder encodes `appId` and normalizes base URL path.
- Startup validation includes URL and numeric validation for standard-endpoint envs.

## Integrator Trust-Boundary Assessment

- **Current posture:** strong cryptographic request integrity for Standard Endpoint POST ingest.
- **Most material boundary risk:** not in AppAssertion cryptography; it is in outbound fetch policy around RSS URLs.
- **Operational trust dependencies:** registry and exchange-rate outbound endpoints are externally dependent and environment-trust sensitive.

## Prioritized Mitigation Paths

1. Add SSRF network controls for RSS URL fetches (highest impact).
2. Tighten deployment guarantees for `STANDARD_ENDPOINT_TRUST_PROXY`.
3. Pin/allowlist outbound provider and registry hosts.
4. Improve failure-mode handling/telemetry for registry and replay-store dependencies.

## Plan 04 Completion Checklist

- [x] Outbound request inventory completed (RSS, exchange rates, registry).
- [x] URL source classification completed (user-influenced vs env-driven).
- [x] Standard Endpoint trust controls reviewed (HTTPS + AppAssertion + replay).
- [x] Findings include exploit preconditions and mitigation options.
- [x] No code fixes implemented.
