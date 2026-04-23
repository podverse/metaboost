---
name: e2e-permission-actor-matrix
description: Apply the thorough CRUD permission permutation test process to E2E specs. Use when adding or aligning tests for permission-gated pages (edit/detail/settings) so all actor × outcome permutations and key flows are covered.
version: 1.0.0
---

# E2E Permission Actor Matrix

Current E2E bar: **Confident**. Use this skill when implementing or reviewing E2E tests for any permission-gated surface (bucket admin edit, role edit, message edit, settings, management resource edit/detail, etc.). The goal is to bring every such spec into alignment with the same thorough, CRUD-permutation approach used in the web bucket-admin-edit specs.

## Reference implementation

- **Specs (web, split by actor):** The actor × outcome matrix for bucket-admin-edit is implemented across [bucket-admin-edit-unauthenticated.spec.ts](apps/web/e2e/bucket-admin-edit-unauthenticated.spec.ts), [bucket-admin-edit-bucket-owner.spec.ts](apps/web/e2e/bucket-admin-edit-bucket-owner.spec.ts), [bucket-admin-edit-bucket-admin.spec.ts](apps/web/e2e/bucket-admin-edit-bucket-admin.spec.ts), [bucket-admin-edit-admin-without-permission.spec.ts](apps/web/e2e/bucket-admin-edit-admin-without-permission.spec.ts), and [bucket-admin-edit-non-admin.spec.ts](apps/web/e2e/bucket-admin-edit-non-admin.spec.ts). Together they cover unauthenticated, owner, admin with permission, admin without permission, and non-admin.
- **Pattern:** API/source-of-truth → actor matrix table → seed + login helpers → tests per actor × outcome + flow tests (one spec per actor or combined as needed).

## Process (apply to each permission-gated spec)

### 1. Establish API/source of truth

- Identify the permission policy (e.g. `canManageBucketAdmins`, bucket/role/message CRUD bits).
- Document which actors can perform which actions (e.g. owner vs non-owner-admin with/without permission vs non-admin).
- Note how the app treats API responses (e.g. 403 → not found).

### 2. Define the actor matrix

Build a table of **actors** × **expected outcome** when opening or acting on the page:

- **Unauthenticated** → redirect to login.
- **Fully privileged** (e.g. owner, superadmin) → can open; read-only vs editable by row/target as per policy.
- **Privileged non-owner** (e.g. admin with permission) → same as owner where policy allows; otherwise not found/forbidden.
- **Restricted** (e.g. admin without permission, or non-admin) → not found or forbidden (match API behavior).

Add rows for **target** × **actor** where relevant (e.g. edit owner row → read-only; edit other admin → form with Save; invalid id → not found).

### 3. Seed and login helpers

- Ensure E2E seed (or test data) includes all required actors: owner, non-owner with permission, non-owner without permission, non-admin (or management equivalents).
- Provide login helpers per role (e.g. `loginAsWebE2EUserAndExpectDashboard`, `loginAsWebE2EAdminWithPermission`, `loginAsWebE2EAdminWithoutPermission`, `loginAsWebE2ENonAdmin`).
- Use `setE2EUserContext(testInfo, '…')` at the start of each test so the report shows which role is in effect.

### 4. Implement tests

- **Unauthenticated:** redirect to login (e.g. `expectUnauthedRouteRedirectsToLogin`).
- **Owner / fully privileged:** happy path (open edit, read-only for owner row, form for other row), invalid id → not found.
- **Non-owner with permission:** open edit on owner row → read-only (or not found if API does not return owner); open edit on self/other → form; invalid id → not found.
- **Non-owner without permission:** open edit (any target) → not found (e.g. `expectInvalidRouteShowsNotFound`).
- **Non-admin:** open edit (any target) → not found.
- **Flow tests:** list → edit navigation; Cancel → list; Save → list and persistence where applicable.

Use existing helpers: `expectInvalidRouteShowsNotFound`, `actionAndCapture`, `capturePageLoad`, `setE2EUserContext`.

### 5. Quality bar

- Every actor in the matrix has at least one test that asserts the expected outcome.
- Invalid or forbidden targets (invalid id, wrong permission) assert not found or equivalent stable UI.
- Navigation flows (list→edit, Cancel→list) are covered for at least one privileged actor.
- No permission-sensitive scenario is marked done with only "route loads" or a single-actor test.

## Cross-reference

- **e2e-crud-state-matrix:** CRUD and UI-state coverage (create/read/update/delete, validation, empty/loading/error).
- **e2e-authz-matrix:** Role/ownership visibility and disabled states; use together with this skill for full coverage.
- **e2e-readability:** Verbose step names and `setE2EUserContext` for report clarity.

## Completion checklist (per spec)

- [ ] API/source-of-truth behavior documented or referenced.
- [ ] Actor matrix table defined (actors × outcomes).
- [ ] Seed data and login helpers exist for all actors.
- [ ] Unauthenticated test present.
- [ ] Each privileged actor has tests for allowed and disallowed targets.
- [ ] Restricted actors (no permission / non-admin) get not found or forbidden.
- [ ] List→edit and Cancel→list (and Save→list where relevant) covered.
- [ ] Invalid id (or equivalent) → not found for at least one privileged actor.
- [ ] Targeted spec run passes; no regression in full app E2E.
