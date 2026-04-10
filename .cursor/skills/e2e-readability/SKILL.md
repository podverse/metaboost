---
name: e2e-readability
description: E2E specs use verbose complete sentences and explicit post-navigation verification; report keeps redirect-to-login summary-only and hides only non-validating navigation screenshots.
version: 1.2.0
---

# E2E Readability and Report Behavior

Use this skill when adding or editing E2E specs in `apps/web/e2e/` or `apps/management-web/e2e/`. Test titles and step labels use complete sentences; the only exception is the **suite-level describe**, which uses a concise title-like phrase (see Describe blocks).

## Describe blocks

**Suite-level describe** (the top-level block that states what the suite verifies): use a **concise, title-like** descriptor, not a full sentence. This is the one place where a short phrase is preferred. **Nested describe blocks, test titles, and step labels** keep **verbose sentence-style** (see Test titles and Step labels below). This convention applies to both `apps/web/e2e` and `apps/management-web/e2e`.

- Good: "Home page for the unauthenticated user"
- Good: "Dashboard for non-admin users"
- Avoid (for suite-level): "This suite verifies the home page for the unauthenticated user."
- **Non-default auth mode:** If the suite runs in a non-default auth mode, end the title with the mode in parentheses. Do not use the word "mode". Default is `admin_only_username` (no suffix). Use `(admin_only_email)` or `(user_signup_email)` only when the spec is run with that config. Examples: "Reset-password page (admin_only_email)", "Signup page (user_signup_email)".

**Nested describe blocks** (feature or group): use a clear full-sentence or phrase for the feature.

- Good: "Creating a new child bucket under an existing bucket"
- Avoid: "Bucket child new"

## Test titles

Use **complete, verbose sentences**. Prefer "When … , they/he/she …" for readability.

- Good: "When an unauthenticated user tries to open the page to create a new child bucket, they are redirected to the login page."
- Good: "When an authenticated user opens the page to create a new child bucket, they see the create form with a name field and a submit button."
- Avoid: "unauthenticated user is redirected to login", "authenticated user sees child bucket create form"

## Step labels

Use **full sentences** for the third argument to `capturePageLoad`, `actionAndCapture`, and `expectUnauthedRouteRedirectsToLogin`, and keep compound terms consistent with titles.

- Good: "User navigates to the admin-edit-route for the bucket-owner's user id and sees not found."
- Good: "The bucket-admin-edit-form is visible for the bucket-admin."
- Avoid: mixing hyphenated compound terms in one section and space-separated terms in another for the same concept.

The reporter preserves step labels as authored, including hyphenated compound terms.

## Post-navigation verification (required)

Every navigation action in E2E tests must be followed by explicit verification that the destination loaded correctly. **Checking only that the URL changed is not enough:** you must verify that at least one expected element on the destination page has loaded (e.g. heading, form field, table, CTA). Otherwise the test (or a step screenshot) may pass while the new page is still loading or not yet rendered.

- Applies to `page.goto(...)`, route-changing link/button clicks, and helper-driven navigation.
- After navigation, assert **both**:
  - URL assertion (`toHaveURL(...)`), and
  - at least one destination-specific element visibility (`toBeVisible()` on heading, form field, table, CTA, etc.).
- Do not rely only on "absence" assertions right after navigation (for example, only checking a value is missing). Add a positive destination-load assertion first.
- **When using `actionAndCapture` for a navigation step** (e.g. click a link, then capture): perform the URL assertion and the element visibility assertion **inside** the callback, so the screenshot is taken only after the destination page has loaded. If you assert only after the callback, the screenshot may show the previous page or a loading state.
- For shared helpers that navigate (for example login helpers), include the destination-load verification inside the helper.

## Redirect-to-login tests

Tests that assert an unauthenticated user is redirected to the login page appear **only in the Test summary** at the top of the E2E HTML report; they are not shown in the "Screenshots and step descriptions" section (to avoid repetitive content). When adding such tests, use a title that clearly indicates redirect to login (e.g. contains "redirected to the login page") so the reporter keeps them summary-only.

## Navigation screenshot filtering in report

The reporter hides **image only** (not step text) for navigation-only, non-validating steps when the same test has a later validation/evidence step.

- Keep the step row and authored step description visible in the report.
- Hide only the screenshot image for navigation-only setup steps.
- Keep screenshots for validation/evidence steps.
- This uses step-label patterns plus same-test local context to avoid over-filtering.
- Redirect-to-login summary-only behavior remains unchanged.

## Error-state screenshot ordering (required)

When a test step expects an error-like result (validation error, invalid credentials, not found, invalid token, or unauth redirect), capture screenshots only after that outcome is verified.

- For `actionAndCapture(...)`, place error-like assertions inside the callback so capture happens after verification.
- For helper wrappers (for example invalid-route and unauth-redirect helpers), verify the expected error-like state inside the wrapped callback before the screenshot is taken.
- Acceptable post-action verification includes:
  - explicit error/validation/not-found text visibility,
  - redirect target verification plus destination UI evidence (for example login form fields).
- Avoid taking screenshots immediately after navigation or submit when the expected error-like state has not yet been asserted.

## User context in reports

Every test that has a defined user (unauthenticated or a specific role) should set the **user-role** annotation so the E2E HTML report shows **User context** for that test. Call `setE2EUserContext(testInfo, description)` at the start of each test (from `./helpers/userContext`).

**Pattern:** Use **role** or **role (permissions)**. Be consistent so the reporter can apply a dedicated color.

**Web app:** Only **unauthenticated**, **basic-user**, **bucket-owner**, and **bucket-admin** (web has no "admin" role). For limited-permission bucket admins use the **same resource/level notation** as management-web inside parentheses: full CRUD = resource name only; read-only = `resource:R`; no access = `resource:-`. Web resources (bucket-scoped): settings, roles, messages, admins, bucket, bucket_create. Examples: `bucket-admin (settings:- roles:- messages:- admins:-)`, `bucket-admin (bucket:R bucket_create:-)`.

**Management-web:** Use **super-admin** for the super-admin identity. For all other management users use **admin (…)** with abbreviated permission notation: full CRUD = resource name only (e.g. `admins`, `users`); read-only = `resource:R` (e.g. `buckets:R`). Examples: `admin (admins users events:own)`, `admin (buckets:R bucket_admins events:all_admins)`. Do not use "limited-admin", "admin with X", or "admin without X" as the role name.

- Good: `super-admin`, `admin (admins users events:own)`, `bucket-owner`, `unauthenticated`
- Avoid: `super-admin`, `limited-admin (users read)`, `admin with bucketAdminsCrud`

The report then shows "User context: <description>" in each test section and in the summary.

## Seeded user role naming

When a test refers to a **specific seeded user role**, use consistent names so "user" vs "owner user" is unambiguous:

- **bucket-owner** — the seeded user who owns the bucket (web: e2e-bucket-owner@example.com). In code/comments: `bucketOwner`.
- **bucket-admin** — the seeded user who is a bucket admin but not the owner (web: e2e-bucket-admin@example.com). In code/comments: `bucketAdmin`.
- **super-admin** — management-web: e2e-superadmin. In code/comments: `superAdmin`.

Avoid "seeded owner user" (prefer bucket-owner) and "seeded non-owner-admin" (prefer bucket-admin) so the role is clear.

## Hyphens for compound concepts in titles and step labels

In **test titles and step labels**, use **hyphens between words** for compound terms that represent one thing. Joining words that refer to a single concept (routes, pages, forms, seeded identities) makes it clearer what is being asserted when reading the report.

- Apply this consistently across **all** specs in both `apps/web/e2e` and `apps/management-web/e2e`.
- **Routes:** admin-edit-route, bucket-admin-edit-route (not "admin edit route" with spaces).
- **Pages:** bucket-admin-edit-page, admin-edit-page (not "bucket admin edit page").
- **Forms:** bucket-admin-edit-form (not "bucket admin edit form").
- **Seeded identities:** bucket-owner, bucket-admin, super-admin (not "seeded bucket owner").
- **Other single concepts:** bucket-admin-permissions when referring to one thing.

Example: "When the user opens the admin-edit-route with the bucket-owner's user id, they see not found." In variable names and constant comments in code, use camelCase (e.g. `bucketOwner`).

## Screenshot shows verified element

When a step documents verification of a **specific element** (e.g. a row, form, or control state), pass that element to the capture helper so the screenshot is taken with it vertically centered. See the **e2e-screenshot-verified-element** skill.

## Reference

See [apps/web/e2e/bucket-nested-new.spec.ts](apps/web/e2e/bucket-nested-new.spec.ts) for the canonical pattern. Reporter logic: [scripts/e2e-html-steps-reporter.ts](scripts/e2e-html-steps-reporter.ts) (`isRedirectToLoginTest`).
