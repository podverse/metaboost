# Phase 2 - API Security/Auth Unit Coverage

## Scope

Add focused unit tests for security-critical auth and assertion logic in API and management-api.

## Steps

1. Expand unit tests for:
   - `apps/api/src/lib/appAssertion/verifyAppAssertion.ts`
   - `apps/api/src/lib/valkey/replayStore.ts` (mock boundary behavior only)
2. Expand JWT helper unit suites for:
   - `apps/api/src/lib/auth/jwt.ts`
   - `apps/management-api/src/lib/auth/jwt.ts`
3. Expand cookie/auth helper tests for:
   - `apps/api/src/lib/auth/cookies.ts`
   - existing startup cookie-domain helper behavior where needed.
4. Expand verification token helper tests for:
   - `apps/api/src/lib/auth/verification-token.ts`
5. Ensure each suite includes:
   - valid behavior,
   - malformed/invalid input rejection,
   - boundary conditions (time windows, claims, domain/path specifics),
   - safe failure outcomes.

## Key Files

- `apps/api/src/lib/appAssertion/verifyAppAssertion.ts`
- `apps/api/src/lib/auth/jwt.ts`
- `apps/management-api/src/lib/auth/jwt.ts`
- `apps/api/src/lib/auth/cookies.ts`
- `apps/api/src/lib/auth/verification-token.ts`
- related `*.test.ts` files in colocated test directories.

## Verification

- New tests are deterministic and avoid network/DB dependency.
- Assertions verify outcomes and security invariants, not implementation internals.
