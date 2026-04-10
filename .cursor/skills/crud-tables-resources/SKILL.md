---
name: crud-tables-resources
description: How CRUD (Create, Read, Update, Delete) is handled for resource tables and detail pages in the Boilerplate management-web app.
---

# CRUD Tables and Resources (Boilerplate)

Use this skill when adding or changing list/detail/edit flows for admins, users, or other CRUD resources in management-web. Keeps table actions, routes, and permissions consistent.

## CRUD flow and routes

For each resource (e.g. Admins, Users):

| Action     | Route pattern          | Page / behavior                                                      |
| ---------- | ---------------------- | -------------------------------------------------------------------- |
| **List**   | `/resources`           | List page with table, search/filter, “Add” when create allowed.      |
| **View**   | `/resources/[id]`      | Read-only detail page; link to Edit when update allowed.             |
| **Create** | `/resources/new`       | Form page; create permission required.                               |
| **Edit**   | `/resources/[id]/edit` | Form page; update permission required (or self for super admin).     |
| **Delete** | (no page)              | Triggered from table row; delete permission required; confirm modal. |

- **Routes**: Define in `apps/management-web/src/lib/routes.ts` — e.g. `adminViewRoute(id)`, `adminEditRoute(id)`, `userViewRoute(id)`, `userEditRoute(id)`.
- **List access**: User must have **read** permission (or be super admin) to see the list; redirect otherwise.

## Table actions order

In `ResourceTableWithFilter`, row actions are shown in this order:

1. **View** — link to `/resources/[id]` (read-only). Shown when `canView` is true (typically when user has read permission).
2. **Edit** — link to `/resources/[id]/edit`. Shown when `canUpdate` (or per-row `getRowActions().canUpdate`) is true.
3. **Delete** — button opening confirm modal. Shown when `canDelete` (or per-row `getRowActions().canDelete`) is true.

View is always before Edit and Delete. Pass `viewRoute`, `viewLabelKey`, and `canView` into `ResourceTableWithFilter`; use `editRoute`, `editLabelKey`, `canUpdate`, `deleteLabelKey`, `canDelete` for Edit/Delete.

## Permissions (CRUD bits)

- **Source**: `getCrudFlags(isSuperAdmin, permissions, 'adminsCrud' | 'usersCrud')` from `lib/main-nav.ts`. Returns `{ create, read, update, delete }`.
- **List page**: Require `crud.read` (or super admin); pass `canViewX={crud.read}`, `canUpdateX={crud.update}`, `canDeleteX={crud.delete}` to the table.
- **View page**: Require read; show Edit button only when `crud.update` (or self-edit for super admin).
- **Edit page**: Require update (or self for super admin); form submit calls update API.
- **Create page**: Require `crud.create`; form submit calls create API.
- **Delete**: API called from table with `onDelete`; require delete permission (and no delete for super admin row).

## ResourceTableWithFilter props (summary)

- **View**: `viewRoute?: (id) => string`, `viewLabelKey?: string`, `canView?: boolean`. When `canView` and viewRoute/viewLabelKey are set, a View link is rendered before Edit.
- **Edit**: `editRoute`, `editLabelKey`, `canUpdate` (or per-row via `getRowActions().canUpdate`).
- **Delete**: `onDelete`, `deleteLabelKey`, `canDelete` (or per-row via `getRowActions().canDelete`), `confirmDeleteTranslationKeyPrefix`, `getDisplayName`, `currentUserId`, `onSelfDelete`.
- **Per-row overrides**: `getRowActions(row)` can return `{ canView?, canUpdate, canDelete }` (e.g. hide Delete for super admin, allow Edit only for self).

## Adding a new CRUD resource

1. **Routes**: Add `ROUTES.RESOURCE`, `ROUTES.RESOURCE_NEW`, plus `resourceViewRoute(id)` and `resourceEditRoute(id)` in `lib/routes.ts`.
2. **List page**: `app/(main)/resources/page.tsx` — fetch list, compute crud flags, render `*TableWithFilter` with `canView*, canUpdate*, canDelete*`, `viewRoute`, `viewLabelKey`, `editRoute`, `onDelete`, etc.
3. **View page**: `app/(main)/resources/[id]/page.tsx` — fetch one by id, require read, show read-only fields and Edit link when update allowed.
4. **Edit page**: `app/(main)/resources/[id]/edit/page.tsx` — fetch one, require update (or self), render form.
5. **Create page**: `app/(main)/resources/new/page.tsx` — require create, render form.
6. **Table component**: e.g. `ResourcesTableWithFilter` — pass `viewRoute`, `viewLabelKey`, `canView`, `editRoute`, `canUpdate`, `canDelete`, `getRowActions` if needed.
7. **i18n**: Add `resourcesTable.view`, `resourcesTable.edit`, `resourcesTable.delete`, `viewResourceTitle`, etc., in `i18n/originals/en-US.json` (and es).

## References

- `apps/management-web/src/components/ResourceTableWithFilter.tsx` — shared table with View / Edit / Delete.
- `apps/management-web/src/components/AdminsTableWithFilter.tsx`, `UsersTableWithFilter.tsx` — examples.
- `apps/management-web/src/lib/main-nav.ts` — `getCrudFlags`, `hasReadPermission`.
- `apps/management-web/src/lib/routes.ts` — route helpers.
