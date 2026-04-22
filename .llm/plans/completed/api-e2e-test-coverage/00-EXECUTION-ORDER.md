# Execution Order

## Phase 1 (any order, all independent)

Run these in any order. All are independent of each other.

1. **01-api-bucket-roles.test.md** - Bucket roles CRUD (apps/api)
2. **02-api-bucket-admin-invitations.test.md** - Bucket admin invitations (apps/api)
3. **05-mgmt-admin-roles.test.md** - Admin roles CRUD (apps/management-api)

## Phase 2 (any order, all independent)

Run these in any order. All are independent of each other.

4. **03-api-public-bucket.test.md** - Public bucket + exchange rates (apps/api)
5. **04-api-auth-update-profile.test.md** - Auth update profile validation (apps/api)
6. **06-mgmt-auth-update-profile.test.md** - Management auth update profile (apps/management-api)
7. **07-mgmt-terms-versions-gaps.test.md** - Terms versions GET/PATCH gaps (apps/management-api)
