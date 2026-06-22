---
name: management-post-save-navigation
description: Post-save navigation via ROUTES to the canonical management-web list for one-row create/edit pages; exceptions for invite links and password-only updates.
---

# Management-web post-save navigation

**When to use:** When adding or changing **create** or **edit** pages in **`apps/management-web`**
that exist to create or update **one primary row** (users, admins, buckets, terms versions, etc.).

## Rule

After a successful **primary** save (POST create or PATCH/PUT profile/settings form), navigate to
the **canonical exit route**. Usually that is the **resource list** named in breadcrumbs:

- Prefer **`ROUTES`** from **`apps/management-web/src/lib/routes.ts`** (e.g. **`ROUTES.USERS`**,
  **`ROUTES.ADMINS`**) over hard-coded path strings.
- Call **`router.refresh()`** after **`router.push`** when the destination list should reload server
  data.

Existing forms that implement this pattern include **`UserForm`**, **`AdminForm`**,
**`TermsVersionForm`**, and **`BucketForm`**.

## Exceptions

- **Invite / set-password URL** in the response — **do not** auto-redirect; keep copy UX (and an
  explicit control to return to the list). Same pattern as **`UserForm`** when **`setPasswordLink`**
  is present.
- **Password-only** updates on a **tabbed user edit** — **stay** on the page with success feedback;
  do not redirect (matches **`UserForm`** **`handleChangePassword`**).
- **Database / table browser** or flows where the correct landing is **row detail** (not the list).
- **Bucket / nested** flows where **detail** is the correct landing (**`BucketForm`** uses
  **`bucketViewRoute`** where appropriate).
- **Wizard / multi-step** flows follow that flow’s return URL.

## Cross-references

- Breadcrumb hierarchy: **management-edit-breadcrumbs**.
- List/table patterns: **crud-tables-resources**.
