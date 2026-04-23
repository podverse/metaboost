# Plan 04: Auth Update Profile and Username-Available Validation (apps/api)

## Scope

Add integration tests for PATCH /auth/me (update profile) validation scenarios and GET /auth/username-available edge cases. The update-profile endpoint is tested in auth-username.test.ts for username but not for displayName-only or validation errors. The username-available endpoint lacks validation edge case tests.

Routes under test:
- `PATCH /v1/auth/me` - Update profile (displayName) with validation
- `GET /v1/auth/username-available` - Validation edge cases

Reference: `apps/api/src/routes/auth.ts` lines 54-62, 51-53

## Test File

Create: `apps/api/src/test/auth-update-profile.test.ts`

## Steps

1. Create test file with `FILE_PREFIX = 'auth-profile'`
2. In `beforeAll`: create test app, create test user
3. Test `PATCH /auth/me` (displayName update):
   - Returns 401 when unauthenticated
   - Returns 200 with updated displayName when valid
   - Returns 400 when body is empty or has invalid fields
   - Returns 400 when displayName exceeds max length (if validation exists)
4. Test `GET /auth/username-available` (validation edge cases not yet covered):
   - Returns 400 or appropriate error for very long username (exceeds column limit)
   - Returns available: false for reserved/invalid patterns (if applicable)

## Key Files

- `apps/api/src/routes/auth.ts` (routes)
- `apps/api/src/controllers/authController.ts` (updateProfile, usernameAvailable)
- `apps/api/src/schemas/auth.ts` (updateProfileSchema)
- Existing pattern: `apps/api/src/test/auth.test.ts`, `apps/api/src/test/auth-username.test.ts`

## Verification

```bash
./scripts/nix/with-env npm run test -w apps/api -- src/test/auth-update-profile.test.ts
```
