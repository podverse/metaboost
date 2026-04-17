# 07 - Metaboost HTTPS Enforcement

## Scope

Define and implement defense-in-depth HTTPS enforcement for Metaboost outside local development.

## Outcomes

- Non-local insecure requests are rejected at app layer.
- Ingress TLS is required and documented as deployment baseline.
- Proxy trust settings are explicit to avoid false positives/negatives.

## Steps

1. Add configuration for HTTPS policy:
   - `STANDARD_ENDPOINT_REQUIRE_HTTPS` (default true outside local);
   - trusted proxy behavior documentation.
2. Implement app-level middleware for request scheme enforcement:
   - allow local development exemptions;
   - honor `X-Forwarded-Proto` only when proxy trust is configured.
3. Apply middleware to Standard Endpoint routes (minimum) and evaluate broader API scope.
4. Update deployment docs to require TLS termination in non-local environments.
5. Add integration tests for:
   - HTTP request in local dev (allowed per policy);
   - HTTP request in non-local (rejected);
   - HTTPS/proxy-forwarded request in non-local (accepted).

## Policy

- Local development:
  - HTTP allowed by default.
- Non-local environments:
  - Ingress must terminate TLS.
  - App must reject insecure request scheme for protected routes.

## Key Files

- [`/Users/mitcheldowney/repos/pv/metaboost/apps/api/src/app.ts`](file:///Users/mitcheldowney/repos/pv/metaboost/apps/api/src/app.ts)
- [`/Users/mitcheldowney/repos/pv/metaboost/apps/api/src/config/index.ts`](file:///Users/mitcheldowney/repos/pv/metaboost/apps/api/src/config/index.ts)
- [`/Users/mitcheldowney/repos/pv/metaboost/apps/api/src/test/`](file:///Users/mitcheldowney/repos/pv/metaboost/apps/api/src/test/)
- [`/Users/mitcheldowney/repos/pv/metaboost/docs/development/ENV-REFERENCE.md`](file:///Users/mitcheldowney/repos/pv/metaboost/docs/development/ENV-REFERENCE.md)

## Verification

- Non-local HTTP requests to `/v1/standard/*` routes return HTTPS-required error.
- HTTPS requests continue to function through proxy ingress.
- Docs include concrete proxy configuration guidance.

## Implementation Notes

- Use explicit environment checks (`NODE_ENV`, app env mode) to avoid accidental production bypass.
- Keep error response simple and developer-friendly.
