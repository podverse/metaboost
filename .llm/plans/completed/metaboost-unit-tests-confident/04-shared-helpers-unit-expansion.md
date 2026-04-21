# Phase 4 - Shared Helpers Unit Expansion

## Scope

Expand unit coverage for high-reuse helper modules to reduce cross-application regression risk.

## Steps

1. Expand tests in `packages/helpers/src/credentials/password.ts`:
   - strength thresholds,
   - minimum length,
   - validation message behavior.
2. Expand tests in `packages/helpers/src/crud/crud-bitmask.ts`:
   - round-trip conversions,
   - invalid/edge bitmask behavior.
3. Evaluate low-coverage helper workspaces for pure logic worth testing:
   - `packages/helpers-requests/`
   - `packages/helpers-valkey/`
   - `packages/helpers-currency/`
   - `packages/helpers-backend-api/`
   - `packages/helpers-i18n/`
4. Add tests only where logic is reusable and behaviorally meaningful.

## Key Files

- `packages/helpers/src/credentials/password.ts`
- `packages/helpers/src/crud/crud-bitmask.ts`
- selected files under helper workspaces listed above.

## Verification

- Every newly added helper suite improves behavior confidence for at least two call sites or one security-sensitive path.
- Avoid adding tests for trivial wrappers with no decision logic.
