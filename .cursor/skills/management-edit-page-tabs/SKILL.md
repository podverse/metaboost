---
name: management-edit-page-tabs
description: Use a consistent tabbed layout on management-web edit pages when there are multiple distinct forms (e.g. profile vs password).
---

# Management-web edit page tabs

**When to use:** When adding or changing edit pages in management-web that have multiple distinct forms (e.g. profile vs change password, or multiple logical sections that could be separate forms).

## Rule

Use a tabbed layout with **one tab per form** (or logical group):

- Use `Tabs` from `@metaboost/ui` with `LinkComponent={Link}` and `exactMatch`.
- Follow **tab-active-state-url-match** for canonical tab href / `activeHref` behavior.
- Use `?tab=...` in the URL and a route helper (e.g. `userEditRoute(id, tab)`) so the active tab matches with and without query params.
- Default tab = first tab (no param or explicit first tab value).

## References

- Edit User page: Profile / Change password tabs (`apps/management-web/src/app/(main)/user/[id]/edit/`, `EditUserPageContent.tsx`, `userEditRoute(id, tab)`).
- Settings: General / Profile / Password tabs (`apps/management-web/src/app/(main)/settings/SettingsContent.tsx`, `accountSettingsRoute(tab)`).

## Single-form edit pages

Edit pages with a single form (e.g. admin edit, bucket admin edit, role edit, message edit) do not need tabs. If a future edit page gains a second form, apply this pattern.
