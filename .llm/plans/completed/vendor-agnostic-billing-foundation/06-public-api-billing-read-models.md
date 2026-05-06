# 06 — Public API Billing Read Models (Metaboost)

## Scope

- Define stable billing read-model endpoints for public and authenticated use cases.
- Provide client-safe payloads for web and future app clients.

## Steps

1. Add product membership read routes under the product namespace.
   - resolved membership/product defaults payload
   - pricing payload behavior for signup-gated scenarios
2. Add authenticated billing read-model endpoint.
   - tier, expiry, cadence, auto-renew mode, renewal attempt summary
   - resolved monthly/annual pricing and currency information
3. Define strict response contracts and field names.
   - avoid ambiguous naming
   - ensure nullable fields are intentional and documented
4. Ensure read model controllers are DB-first with deterministic fallback behavior.
5. Add integration tests for route contracts and access controls.

## Key files to touch later

- `apps/api/src/routes/`
- `apps/api/src/controllers/`
- `apps/api/src/schemas/`
- `apps/api/src/test/`
- `packages/helpers-requests/src/`
- `packages/helpers/src/`

## Verification

- Endpoint responses stay stable for authenticated and unauthenticated flows.
- Billing read-model includes tier, expiry, cadence, auto-renew, and renewal metadata.
- Contract tests lock required fields and expected nullability.
- API payloads contain only client-safe data.
