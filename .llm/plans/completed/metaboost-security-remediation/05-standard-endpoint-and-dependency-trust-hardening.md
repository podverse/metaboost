# 05 - Standard Endpoint and Dependency Trust Hardening

## Priority

- Severity: Medium + Low
- Rollout risk: Medium
- Bucket: P3

## Scope

Remediate/harden:

- M2: trust-proxy deployment sensitivity for HTTPS enforcement.
- M6: registry/provider trust and availability coupling.
- L1/L2/L3: JWT claim policy, distributed rate-limit durability, internal auth-header trust assumptions.

## Steps

1. Tighten trust-proxy operational policy:
   - document and validate safe topology preconditions for `STANDARD_ENDPOINT_TRUST_PROXY=true`;
   - add startup/deploy-time guardrails where feasible.
2. Add outbound host policy for registry/provider URLs:
   - allowlist/pin expected hosts;
   - improve failure-mode behavior and telemetry.
3. Define phased JWT claim-policy hardening (`iss`/`aud`, versioning approach) with compatibility strategy.
4. Plan/implement production distributed limiter store adoption path (Valkey/Redis-backed).
5. Ensure internal auth-context headers cannot be spoofed by inbound client traffic.

## Key Files

- `apps/api/src/middleware/requireHttpsForStandardEndpoints.ts`
- `apps/api/src/lib/standardEndpoint/httpsScheme.ts`
- `apps/api/src/config/standardEndpointRegistry.ts`
- `apps/api/src/lib/appRegistry/AppRegistryService.ts`
- `apps/api/src/lib/exchangeRates.ts`
- `apps/api/src/lib/auth/jwt.ts`
- `apps/management-api/src/lib/auth/jwt.ts`
- `packages/helpers-backend-api/src/rateLimit.ts`
- `apps/web/src/lib/server-auth.ts`
- `apps/management-web/src/lib/server-auth.ts`
- Deployment/runbook docs for standard endpoint and environment policy

## Verification

1. Add/update API integration tests for trust-proxy and dependency policy enforcement where practical.
2. Add/update unit/integration tests around JWT claim validation strategy (if implemented in this phase).
3. Validate distributed limiter behavior in non-local environment test profile.
4. Add regression checks ensuring inbound spoofed auth headers are not trusted.

## Deliverable

- Standard endpoint trust assumptions and external dependency controls are explicit, testable, and operationally enforceable.
