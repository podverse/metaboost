# 04 - Non-SQL Outbound Requests, SSRF, and Integrator Trust Boundaries

## Scope

Audit all server-side outbound HTTP and third-party trust paths, with emphasis on SSRF and replay/integrity boundaries.

## Steps

1. Inventory every server-side `fetch`/HTTP client call in runtime code.
2. For each call, classify URL source:
   - hardcoded trusted URL
   - env-configured URL
   - user-influenced URL
3. Evaluate SSRF controls:
   - scheme restrictions
   - redirect handling
   - host/IP allowlist or denylist
   - private network/metadata endpoint blocking
   - timeout and response-size limits
4. Audit Standard Endpoint trust controls:
   - app assertion verification
   - replay protection
   - binding to body/path claims
   - proxy/forwarded-proto assumptions
5. Confirm failure behavior does not leak sensitive details.

## Key Files

- `apps/api/src/controllers/bucketsController.ts`
- `apps/api/src/lib/rss-sync.ts`
- `apps/api/src/lib/rss-outbound.ts`
- `apps/api/src/lib/exchangeRates.ts`
- `apps/api/src/routes/standardEndpoint.ts`
- `apps/api/src/middleware/requireAppAssertion.ts`
- `apps/api/src/lib/appAssertion/verifyAppAssertion.ts`
- `apps/api/src/lib/standardEndpoint/httpsScheme.ts`

## Output

- `Outbound/SSRF and trust-boundary report` with:
  - endpoint-by-endpoint risk rating
  - exploit preconditions
  - concrete mitigation options ordered by effort/impact

## Verification

- Every outbound request has a URL source template contract.
- User-influenced outbound paths include explicit SSRF reasoning.
- Standard Endpoint integrity assumptions are documented and testable.
