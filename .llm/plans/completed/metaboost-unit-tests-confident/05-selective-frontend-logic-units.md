# Phase 5 - Selective Frontend Logic Unit Coverage

## Scope

Add unit tests for high-value frontend logic modules, with minimal component-level tests only when needed.

## Steps

1. Add/expand tests for `apps/web/src/lib/bucket-authz.ts`:
   - CRUD permission checks,
   - normalization behavior,
   - policy parity with backend expectations.
2. Identify any additional pure frontend modules with security/permission impact and add targeted tests.
3. Add component tests only where logic is not testable via pure utility exports.
4. Skip broad snapshot coverage and focus on behavioral assertions.

## Key Files

- `apps/web/src/lib/bucket-authz.ts`
- related frontend unit test files.

## Verification

- Frontend policy logic has branch coverage for meaningful allow/deny outcomes.
- Test suite remains maintainable and not snapshot-dominated.
