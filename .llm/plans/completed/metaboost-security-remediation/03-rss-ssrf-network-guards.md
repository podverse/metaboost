# 03 - RSS SSRF Network Guards and Safe Outbound Fetching

## Priority

- Severity: High
- Rollout risk: Medium-High
- Bucket: P1

## Scope

Remediate:

- H2: user-influenced RSS fetch path without network-level SSRF controls.

## Steps

1. Create a centralized outbound URL safety validator for user-influenced RSS URLs.
2. Enforce DNS/IP destination policy:
   - block loopback, private, link-local, and metadata destinations;
   - validate destination after resolution and across redirect hops.
3. Harden fetch behavior:
   - restrict or explicitly validate redirects;
   - enforce max response body size/read limits for RSS parsing;
   - preserve timeouts and clear error template contract.
4. Route all RSS fetch entry points through the shared safe outbound path.
5. Add operational controls:
   - structured logging for blocked SSRF attempts;
   - config knobs only where necessary, with safe defaults.

## Key Files

- `apps/api/src/controllers/bucketsController.ts`
- `apps/api/src/lib/rss-sync.ts`
- `apps/api/src/lib/rss-outbound.ts`
- `apps/api/src/config/index.ts`
- `apps/api/src/lib/startup/validation.ts`
- Any new shared outbound safety helper path in `apps/api/src/lib/`

## Verification

1. Add/update API integration tests for:
   - rejection of blocked IP ranges and metadata targets;
   - unsafe redirect rejection;
   - response-size enforcement;
   - acceptance of legitimate public RSS feeds.
2. Validate no regressions for normal bucket RSS verification/sync behavior.
3. Confirm operational observability for blocked attempts.

## Deliverable

- RSS outbound fetches enforce explicit SSRF protections with tested, centralized policy.
