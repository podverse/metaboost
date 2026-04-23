# COPY-PASTA

Use these prompts to implement each plan. All plans are independent and can run in parallel.

## Phase 1 (any order)

### Plan 01 - Bucket Roles CRUD (apps/api)

```
Implement the plan in .llm/plans/active/api-e2e-test-coverage/01-api-bucket-roles.test.md
Create apps/api/src/test/bucket-roles.test.ts with integration tests for bucket roles CRUD endpoints.
Follow the patterns in apps/api/src/test/buckets.test.ts.
Run: ./scripts/nix/with-env npm run test -w apps/api -- src/test/bucket-roles.test.ts
```

### Plan 02 - Bucket Admin Invitations (apps/api)

```
Implement the plan in .llm/plans/active/api-e2e-test-coverage/02-api-bucket-admin-invitations.test.md
Create apps/api/src/test/bucket-admin-invitations.test.ts with integration tests for user-facing admin invitation endpoints (get by token, accept, reject).
Follow the patterns in apps/api/src/test/bucket-admins.test.ts.
Run: ./scripts/nix/with-env npm run test -w apps/api -- src/test/bucket-admin-invitations.test.ts
```

### Plan 05 - Admin Roles CRUD (apps/management-api)

```
Implement the plan in .llm/plans/active/api-e2e-test-coverage/05-mgmt-admin-roles.test.md
Create apps/management-api/src/test/management-admin-roles.test.ts with integration tests for management admin roles CRUD endpoints.
Follow the patterns in apps/management-api/src/test/management-admins-permissions.test.ts.
Run: ./scripts/nix/with-env npm run test -w apps/management-api -- src/test/management-admin-roles.test.ts
```

## Phase 2 (any order)

### Plan 03 - Public Bucket + Exchange Rates (apps/api)

```
Implement the plan in .llm/plans/active/api-e2e-test-coverage/03-api-public-bucket.test.md
Create apps/api/src/test/public-bucket-and-exchange-rates.test.ts with integration tests for GET /buckets/public/:id and GET /exchange-rates.
Follow the patterns in apps/api/src/test/buckets.test.ts.
Run: ./scripts/nix/with-env npm run test -w apps/api -- src/test/public-bucket-and-exchange-rates.test.ts
```

### Plan 04 - Auth Update Profile (apps/api)

```
Implement the plan in .llm/plans/active/api-e2e-test-coverage/04-api-auth-update-profile.test.md
Create apps/api/src/test/auth-update-profile.test.ts with integration tests for PATCH /auth/me displayName update and GET /auth/username-available validation edge cases.
Follow the patterns in apps/api/src/test/auth.test.ts and apps/api/src/test/auth-username.test.ts.
Run: ./scripts/nix/with-env npm run test -w apps/api -- src/test/auth-update-profile.test.ts
```

### Plan 06 - Management Auth Update Profile (apps/management-api)

```
Implement the plan in .llm/plans/active/api-e2e-test-coverage/06-mgmt-auth-update-profile.test.md
Create apps/management-api/src/test/management-auth-update-profile.test.ts with integration tests for PATCH /auth/me (updateProfile) in the management-api.
Follow the patterns in apps/management-api/src/test/management-api.test.ts.
Run: ./scripts/nix/with-env npm run test -w apps/management-api -- src/test/management-auth-update-profile.test.ts
```

### Plan 07 - Terms Versions GET/PATCH Gaps (apps/management-api)

```
Implement the plan in .llm/plans/active/api-e2e-test-coverage/07-mgmt-terms-versions-gaps.test.md
Add new describe blocks to apps/management-api/src/test/management-terms-versions.test.ts for GET /terms-versions/:id and PATCH /terms-versions/:id.
Follow the existing patterns in that file.
Run: ./scripts/nix/with-env npm run test -w apps/management-api -- src/test/management-terms-versions.test.ts
```
