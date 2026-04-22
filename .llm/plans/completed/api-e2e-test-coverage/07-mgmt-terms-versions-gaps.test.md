# Plan 07: Terms Versions GET/PATCH Gaps (apps/management-api)

## Scope

Add integration tests for two untested terms-versions endpoints in management-api. The existing `management-terms-versions.test.ts` covers POST (create), promote-to-current, and list -- but GET /:id and PATCH /:id are untested.

Routes under test:
- `GET /v1/terms-versions/:id` - Get single terms version
- `PATCH /v1/terms-versions/:id` - Update draft/upcoming terms version

Reference: `apps/management-api/src/routes/termsVersions.ts` lines 18-38

## Test File

Add tests to existing file: `apps/management-api/src/test/management-terms-versions.test.ts`

## Steps

1. Add new describe blocks to the existing test file
2. Test `GET /terms-versions/:id`:
   - Returns 401 without auth
   - Returns 200 with terms version when valid id
   - Returns 404 for nonexistent id
   - Requires super admin (returns 403 for non-super admin)
3. Test `PATCH /terms-versions/:id`:
   - Returns 401 without auth
   - Returns 200 with updated terms version when valid body
   - Returns 404 for nonexistent id
   - Validates fields (contentTextEnUs, contentTextEs, title, announcementStartsAt, enforcementStartsAt)
   - Requires super admin (returns 403 for non-super admin)

## Key Files

- `apps/management-api/src/routes/termsVersions.ts` (routes)
- `apps/management-api/src/controllers/termsVersionsController.ts` (getTermsVersion, updateTermsVersion)
- `apps/management-api/src/schemas/termsVersions.ts` (updateTermsVersionSchema)
- Existing: `apps/management-api/src/test/management-terms-versions.test.ts`

## Verification

```bash
./scripts/nix/with-env npm run test -w apps/management-api -- src/test/management-terms-versions.test.ts
```
