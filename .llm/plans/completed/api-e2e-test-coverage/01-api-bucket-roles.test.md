# Plan 01: Bucket Roles CRUD (apps/api)

## Scope

Add integration tests for bucket roles CRUD endpoints in `apps/api`. These routes are completely untested today.

Routes under test:
- `GET /v1/buckets/:bucketId/roles` - List predefined + custom roles for a bucket
- `POST /v1/buckets/:bucketId/roles` - Create custom bucket role
- `PATCH /v1/buckets/:bucketId/roles/:roleId` - Update custom bucket role
- `DELETE /v1/buckets/:bucketId/roles/:roleId` - Delete custom bucket role

Reference: `apps/api/src/routes/buckets.ts` lines 100-117

## Test File

Create: `apps/api/src/test/bucket-roles.test.ts`

## Steps

1. Create test file with `FILE_PREFIX = 'bucket-roles'`
2. In `beforeAll`: create test app, create owner user, create mb-root bucket
3. Test `GET /buckets/:bucketId/roles`:
   - Returns 401 when unauthenticated
   - Returns 200 with roles array including predefined roles when authenticated
4. Test `POST /buckets/:bucketId/roles`:
   - Returns 401 when unauthenticated
   - Returns 400 when name is missing
   - Returns 201 with created role when body valid
   - Rejects invalid crud values (outside 0-15)
5. Test `PATCH /buckets/:bucketId/roles/:roleId`:
   - Returns 404 for nonexistent roleId
   - Returns 200 with updated role when body valid
6. Test `DELETE /buckets/:bucketId/roles/:roleId`:
   - Returns 404 for nonexistent roleId
   - Returns 204 when role exists and is deleted
   - Role no longer appears in list after delete

## Key Files

- `apps/api/src/routes/buckets.ts` (routes)
- `apps/api/src/controllers/bucketRolesController.ts` (controllers)
- `apps/api/src/schemas/buckets.ts` (schemas: createBucketRoleSchema, updateBucketRoleSchema)
- Existing pattern: `apps/api/src/test/buckets.test.ts`

## Verification

```bash
./scripts/nix/with-env npm run test -w apps/api -- src/test/bucket-roles.test.ts
```
