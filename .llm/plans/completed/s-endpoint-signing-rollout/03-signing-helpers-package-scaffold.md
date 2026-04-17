# 03 - Signing Helpers Package Scaffold

**Note:** The workspace package was later renamed to **`metaboost-signing-helpers`** (directory `packages/metaboost-signing-helpers/`) for public npm clarity; plan text below still describes the original scaffold layout.

## Scope

Define a framework-agnostic npm helper package in the Metaboost monorepo for third-party backend APIs to generate valid Standard Endpoint signatures.

## Outcomes

- New workspace package structure is consistent with monorepo patterns.
- Package exports a minimal v1 API focused on signing primitives.
- No framework-specific middleware is included in v1.

## Steps

1. Create package scaffold (name suggestion: `packages/helpers-signing`):
   - `src/index.ts`
   - `src/claims/createAssertionClaims.ts`
   - `src/hash/hashRequestBody.ts`
   - `src/sign/signAppAssertion.ts`
   - `src/http/buildSignedRequestHeaders.ts`
   - `src/types.ts`
2. Add runtime-safe input validation and clear error messages for helper functions.
3. Add package scripts and workspace wiring:
   - `build`, `lint`, `test`.
4. Add unit tests for each primitive and integration tests for end-to-end header generation.
5. Add package-level README with backend-only security guidance.

## v1 API Surface

- `createAssertionClaims(...)`
- `hashRequestBody(...)`
- `signAppAssertion(...)`
- `buildSignedRequestHeaders(...)`

## Design Constraints

- Framework-agnostic only in v1.
- No key retrieval from remote registry in package runtime.
- Keep cryptographic output aligned with verifier contract in plan `06`.

## Key Files

- [`/Users/mitcheldowney/repos/pv/metaboost/packages/`](file:///Users/mitcheldowney/repos/pv/metaboost/packages/)
- [`/Users/mitcheldowney/repos/pv/metaboost/apps/api/src/routes/`](file:///Users/mitcheldowney/repos/pv/metaboost/apps/api/src/routes/)
- [`/Users/mitcheldowney/repos/pv/metaboost/docs/api/STANDARD-ENDPOINT-APP-SIGNING.md`](file:///Users/mitcheldowney/repos/pv/metaboost/docs/api/STANDARD-ENDPOINT-APP-SIGNING.md)

## Verification

- Helper package tests prove output compatibility with verifier fixtures.
- API examples produce deterministic `Authorization: AppAssertion ...` values for known fixtures.
- README clearly communicates backend-only usage and key security requirements.
