# Plan 02: Bucket Admin Invitations Accept/Reject/Get (apps/api)

## Scope

Add integration tests for user-facing bucket admin invitation endpoints in `apps/api`. These routes are completely untested today.

Routes under test:
- `GET /v1/admin-invitations/:token` - Get invitation details by token (public)
- `POST /v1/admin-invitations/:token/accept` - Accept invitation (authenticated)
- `POST /v1/admin-invitations/:token/reject` - Reject invitation (authenticated)

Reference: `apps/api/src/routes/bucketAdminInvitations.ts`

## Test File

Create: `apps/api/src/test/bucket-admin-invitations.test.ts`

## Steps

1. Create test file with `FILE_PREFIX = 'bucket-admin-inv'`
2. In `beforeAll`: create test app, create owner user, create mb-root bucket, create an invitation token via ORM
3. Test `GET /admin-invitations/:token`:
   - Returns 404 for invalid/unknown token
   - Returns 200 with invitation details (bucket name, inviter info) for valid token
4. Test `POST /admin-invitations/:token/accept`:
   - Returns 401 when unauthenticated
   - Returns 200 when authenticated user accepts valid invitation
   - Returns 404 for invalid token
   - Returns appropriate error when invitation already accepted/expired
5. Test `POST /admin-invitations/:token/reject`:
   - Returns 401 when unauthenticated
   - Returns 200 when authenticated user rejects valid invitation
   - Returns 404 for invalid token

## Key Files

- `apps/api/src/routes/bucketAdminInvitations.ts` (routes)
- `apps/api/src/controllers/bucketAdminInvitationsController.ts` (controllers)
- Existing pattern: `apps/api/src/test/bucket-admins.test.ts`

## Verification

```bash
./scripts/nix/with-env npm run test -w apps/api -- src/test/bucket-admin-invitations.test.ts
```
