# Phase 3 - Bucket Authz and Permissions Unit Coverage

## Scope

Add unit suites for bucket authorization and effective-bucket resolution logic across API and management-api.

## Steps

1. Add/expand tests for `apps/api/src/lib/bucket-policy.ts`:
   - CRUD bit checks for bucket/message/admin/role actions.
   - owner/admin/member/public permutations at representative depth.
2. Add/expand tests for `apps/api/src/lib/bucket-effective.ts`:
   - UUID guard behavior.
   - root and descendant resolution behavior.
   - malformed input and not-found behavior.
3. Add/expand tests for `apps/management-api/src/lib/bucket-effective.ts`:
   - parity checks for key resolution branches.
4. Keep permutations bounded:
   - include representative matrix rows for each policy branch,
   - skip exhaustive Cartesian expansions.

## Key Files

- `apps/api/src/lib/bucket-policy.ts`
- `apps/api/src/lib/bucket-effective.ts`
- `apps/management-api/src/lib/bucket-effective.ts`
- related `*.test.ts` files.

## Verification

- Tests capture authorization intent clearly and document branch rationale.
- No policy branch in these files remains unasserted.
