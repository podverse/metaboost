# 03 - Management DB Permutation Seeding

## Scope

Increase management DB seed diversity so management-web can be exercised across realistic permission and audit permutations.

## Steps

1. Expand admin persona generation:
   - super admin
   - full CRUD admin
   - read-only admin
   - bucket-focused admin
   - bucket-admin-management-only admin
   - event-limited admin.
2. Populate `admin_permissions` across all relevant dimensions:
   - `adminsCrud`
   - `usersCrud`
   - `bucketsCrud`
   - `bucketMessagesCrud`
   - `bucketAdminsCrud`
   - `eventVisibility`.
3. Add management event permutations:
   - varied actions (`created`, `updated`, `deleted`, `login`, etc.)
   - actor/target combinations
   - nullable field combinations (`target_type`, `target_id`, `details`)
   - realistic chronology spread.
4. Optionally seed management refresh token rows for session-oriented UI checks.
5. Add deterministic persona toggles so specific permission matrices can be reproduced reliably.

## Key files

- `/Users/mitcheldowney/repos/pv/metaboost/tools/generate-data/src/management/seed.ts`
- `/Users/mitcheldowney/repos/pv/metaboost/packages/management-orm/src/entities/AdminPermissions.ts`
- `/Users/mitcheldowney/repos/pv/metaboost/packages/management-orm/src/entities/ManagementEvent.ts`
- `/Users/mitcheldowney/repos/pv/metaboost/packages/management-orm/src/entities/ManagementUser.ts`

## Verification

- Seed `management` mode and confirm all permission dimensions are populated with meaningful variation.
- Validate management-web screens for role/permission-specific UI states.
- Ensure generated events include enough variety for filter/sort/audit UI validation.
