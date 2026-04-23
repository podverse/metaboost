# Plan 06: Management Auth Update Profile (apps/management-api)

## Scope

Add integration test for `PATCH /v1/auth/me` (updateProfile) in the management-api. This route is currently untested -- the management-api.test.ts covers login, logout, refresh, me, and change-password but not updateProfile.

Route under test:
- `PATCH /v1/auth/me` - Update own display name

Reference: `apps/management-api/src/routes/auth.ts` lines 33-35

## Test File

Create: `apps/management-api/src/test/management-auth-update-profile.test.ts`

## Steps

1. Create test file with `FILE_PREFIX = 'mgmt-aup'`
2. In `beforeAll`: create test app with super admin, login
3. Test `PATCH /auth/me`:
   - Returns 401 without auth
   - Returns 200 with updated displayName when valid body sent
   - Returns 400 when body is empty or displayName is missing
   - Returns 400 when displayName exceeds max length
   - Subsequent GET /auth/me reflects the updated displayName

## Key Files

- `apps/management-api/src/routes/auth.ts` (routes)
- `apps/management-api/src/controllers/authController.ts` (updateProfile)
- `apps/management-api/src/schemas/auth.ts` (updateProfileSchema)
- Existing pattern: `apps/management-api/src/test/management-api.test.ts`

## Verification

```bash
./scripts/nix/with-env npm run test -w apps/management-api -- src/test/management-auth-update-profile.test.ts
```
