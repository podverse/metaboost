# Plan 05: Admin Roles CRUD (apps/management-api)

## Scope

Add integration tests for management admin roles CRUD endpoints. These routes are completely untested today.

Routes under test:
- `GET /v1/admins/roles` - List predefined + custom management admin roles
- `POST /v1/admins/roles` - Create custom management admin role
- `PATCH /v1/admins/roles/:roleId` - Update custom management admin role
- `DELETE /v1/admins/roles/:roleId` - Delete custom management admin role

Reference: `apps/management-api/src/routes/admins.ts` lines 26-54

## Test File

Create: `apps/management-api/src/test/management-admin-roles.test.ts`

## Steps

1. Create test file with `FILE_PREFIX = 'mgmt-ar'` (short prefix for 50-char username limit)
2. In `beforeAll`: create test app with super admin, login as super admin
3. Test `GET /admins/roles`:
   - Returns 401 without auth
   - Returns 200 with roles array including predefined roles when authenticated (super admin)
   - Returns 403 for admin without admins:read permission
4. Test `POST /admins/roles`:
   - Returns 400 when name is missing
   - Returns 400 when crud values invalid (outside 0-15 or wrong shape)
   - Returns 201 with created role when body valid
   - Returns 403 for admin without admins:create permission
5. Test `PATCH /admins/roles/:roleId`:
   - Returns 404 for nonexistent roleId
   - Returns 200 with updated role when body valid
   - Returns 403 for admin without admins:update permission
6. Test `DELETE /admins/roles/:roleId`:
   - Returns 404 for nonexistent roleId
   - Returns 204 when role exists and is deleted
   - Role no longer appears in list after delete
   - Returns 403 for admin without admins:delete permission

## Key Files

- `apps/management-api/src/routes/admins.ts` (routes)
- `apps/management-api/src/controllers/adminRolesController.ts` (controllers)
- `apps/management-api/src/schemas/admins.ts` (createManagementAdminRoleSchema, updateManagementAdminRoleSchema)
- Existing pattern: `apps/management-api/src/test/management-admins-permissions.test.ts`

## Verification

```bash
./scripts/nix/with-env npm run test -w apps/management-api -- src/test/management-admin-roles.test.ts
```
