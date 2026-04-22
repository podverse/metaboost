# API E2E Test Coverage - Summary

## Scope

Add thorough, confident-level integration tests for **untested routes** and **missing scenarios** across both `apps/api` and `apps/management-api`. Focus on genuine gaps only -- routes and scenarios that have zero coverage today.

## Existing Coverage Assessment

### apps/api (30 test files, substantial coverage)

**Well-covered areas:**
- Auth: login, logout, me, change-password, refresh, delete-me, signup, verify-email, forgot/reset-password, set-password, request/confirm-email-change, username-available, update-profile, terms-acceptance, PII/credentials responses
- Auth modes: no-mailer, mailer-enabled, admin-only, signup-mode, locale, username
- Buckets: CRUD (list, get, create, update, delete), child buckets, RSS channel/item create, RSS verify lifecycle, public conversion endpoint, message list/get/delete, threshold filtering, dashboard summary
- Bucket admins: owner protection (cannot update/remove owner)
- Bucket blocked apps: global and per-bucket blocked apps with app assertion
- Bucket blocked senders: exclude blocked sender from list, restore on unblock
- Standard endpoints (mb-v1, mbrss-v1): capability GET, boost POST, public messages, app assertion, HTTPS enforcement, registry config
- Exchange rates service
- Root routes
- CORS path
- Startup validation

### apps/management-api (13 test files, substantial coverage)

**Well-covered areas:**
- Auth: login, logout, refresh, me, change-password, update-profile
- Admins: CRUD (list, get, create, update, delete), change-password, permission gating
- Users: CRUD (list, get, create, update, delete), change-password, permission gating, invitation links, auth mode variations
- Buckets: CRUD, child buckets, settings cascade, public guardrail, RSS channel rename guard
- Bucket roles: list (predefined + custom), create, update, delete, validation
- Bucket messages: list, get, delete, threshold filtering, pagination, stream exclusion, aggregation
- Bucket admins: list, get, update, delete, permission gating
- Bucket admin invitations: list, create, delete, permission gating
- Bucket blocked apps: registry apps list, blocked apps list/add/remove
- Global blocked apps: list, add, remove, permission gating
- Terms versions: create, promote-to-current, duplicate rejection
- Events: list, pagination, actor display name, admin deletion survival
- Root routes

## Identified Gaps

### apps/api gaps

1. **PATCH /auth/me (displayName update)** - No dedicated tests for updating displayName via PATCH /auth/me
2. **GET /auth/username-available** - Only tested in auth-username.test.ts; no validation edge cases (too long, empty string)
3. **GET /buckets/public/:id (public bucket endpoint)** - No test coverage for fetching a public bucket without auth
4. **Bucket admin invitations (user-facing)** - GET /admin-invitations/:token, POST /admin-invitations/:token/accept, POST /admin-invitations/:token/reject are completely untested
5. **Bucket roles CRUD** - No test coverage for list, create, update, delete bucket roles
6. **GET /buckets/:bucketId/summary** - Only tested in bucket-summary.test.ts for dashboard and bucket summary; could use more edge case coverage but existing tests are reasonable
7. **Exchange rates GET /exchange-rates** - Tested via exchange-rates-service.test.ts (service-level) but no route-level integration test

### apps/management-api gaps

1. **PATCH /auth/me (updateProfile)** - No test for updating display name
2. **GET /admins/roles, POST /admins/roles, PATCH /admins/roles/:roleId, DELETE /admins/roles/:roleId** - Admin roles CRUD is completely untested
3. **GET /events** - Tested in management-api.test.ts but limited; no filtering/pagination edge case tests
4. **GET /terms-versions/:id** - Individual terms version GET is untested
5. **PATCH /terms-versions/:id** - Update draft/upcoming terms version is untested
6. **GET /buckets/:id/buckets (child buckets)** - Management API child bucket listing and creation not tested separately from main buckets.test.ts

## Plan Files

| # | File | Topic | Priority |
|---|------|-------|----------|
| 01 | `01-api-bucket-roles.test.md` | Bucket roles CRUD (apps/api) | High |
| 02 | `02-api-bucket-admin-invitations.test.md` | Bucket admin invitations accept/reject/get (apps/api) | High |
| 03 | `03-api-public-bucket.test.md` | Public bucket endpoint and exchange rates route (apps/api) | Medium |
| 04 | `04-api-auth-update-profile.test.md` | PATCH /auth/me and username-available validation (apps/api) | Medium |
| 05 | `05-mgmt-admin-roles.test.md` | Admin roles CRUD (apps/management-api) | High |
| 06 | `06-mgmt-auth-update-profile.test.md` | PATCH /auth/me (apps/management-api) | Medium |
| 07 | `07-mgmt-terms-versions-gaps.test.md` | GET /:id and PATCH /:id for terms versions (apps/management-api) | Medium |

## Dependency Map

All plans are independent -- they test different routes/controllers. They can be implemented in parallel or in any order.

## Recorded Decisions

- Focus on **gaps only** (user confirmed) -- do not add edge cases to already-covered routes
- Follow existing test file patterns (supertest, vitest, file-unique prefixes, clean slate)
- Each new test file should be self-contained with its own fixtures
