# 01 - API standard parity tests

## Scope

Add missing parity coverage so `mb-v1` has the same standard endpoint safety checks as `mbrss-v1`.

## Key files

- `apps/api/src/test/app-assertion-verification.test.ts`
- `apps/api/src/test/cors-path.test.ts`
- `apps/api/src/test/standard-endpoint-https-enforcement.test.ts`
- `apps/api/src/routes/standardEndpoint.ts` (read-only reference while writing tests)

## Steps

1. Extend app-assertion verification tests to include `mb-v1` standard paths:
   - missing Authorization path behavior
   - replay protection behavior
   - suspended app behavior
2. Extend CORS path tests so `mb-v1` OpenAPI route is validated for:
   - reflected Origin behavior under `/v1/standard/*`
   - OPTIONS preflight behavior
3. Keep HTTPS enforcement parity up to date for both standards (ensure both paths are asserted in each relevant scenario).

## Verification

- Targeted API tests pass:
  - `app-assertion-verification.test.ts`
  - `cors-path.test.ts`
  - `standard-endpoint-https-enforcement.test.ts`
- No existing `mbrss-v1` expectations regress.
