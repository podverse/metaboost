# 06 - Metaboost Standard Endpoint AppAssertion Verification

## Scope

Implement AppAssertion verification for signed `POST /v1/standard/*` requests using registry-backed public keys, replay protection, and clear error responses.

## Outcomes

- Unsigned or invalid signed requests are rejected with documented errors.
- Valid app assertions are accepted and forwarded to existing business handlers.
- Verification behavior is covered by integration tests and reflected in OpenAPI docs.

## Steps

1. Add verification middleware and helper modules:
   - token parsing and signature verification;
   - claims validation (`iss`, `iat`, `exp`, `jti`, `m`, `p`, `bh`);
   - request-body hash matching.
2. Add registry loader/cache modules:
   - polling with ETag;
   - last-known-good cache;
   - fail-closed behavior before first successful load.
3. Add app status enforcement (`active`, `suspended`, `revoked`).
4. Add replay protection storage strategy:
   - `iss + jti` uniqueness until token expiry plus skew;
   - use existing infra dependency (Valkey) for distributed behavior.
5. Wire middleware into standards route stack for `POST /v1/standard/*`.
6. Update OpenAPI and API docs for new auth requirements and error codes.
7. Add/adjust integration tests and fixtures to cover:
   - valid assertion;
   - missing/invalid token;
   - bad signature;
   - claim mismatch;
   - replay;
   - suspended app.

## Error Contract To Preserve

- `app_assertion_required`
- `app_assertion_invalid`
- `app_assertion_expired`
- `app_assertion_replay`
- `app_not_registered`
- `app_suspended`

## Key Files

- [`/Users/mitcheldowney/repos/pv/metaboost/apps/api/src/routes/standards.ts`](file:///Users/mitcheldowney/repos/pv/metaboost/apps/api/src/routes/standards.ts)
- [`/Users/mitcheldowney/repos/pv/metaboost/apps/api/src/routes/mbrssV1.ts`](file:///Users/mitcheldowney/repos/pv/metaboost/apps/api/src/routes/mbrssV1.ts)
- [`/Users/mitcheldowney/repos/pv/metaboost/apps/api/src/openapi-mbrssV1.ts`](file:///Users/mitcheldowney/repos/pv/metaboost/apps/api/src/openapi-mbrssV1.ts)
- [`/Users/mitcheldowney/repos/pv/metaboost/apps/api/src/test/`](file:///Users/mitcheldowney/repos/pv/metaboost/apps/api/src/test/)
- [`/Users/mitcheldowney/repos/pv/metaboost/docs/api/STANDARD-ENDPOINT-APP-SIGNING.md`](file:///Users/mitcheldowney/repos/pv/metaboost/docs/api/STANDARD-ENDPOINT-APP-SIGNING.md)

## Verification

- Integration tests pass for all auth decision paths.
- OpenAPI includes AppAssertion security expectations and response examples.
- Existing signed-client flow remains compatible with documented spec.

## Implementation Notes

- Keep middleware reusable for future `POST /v1/standard/*` routes.
- Ensure request-body hashing uses the exact bytes expected by signing spec.
