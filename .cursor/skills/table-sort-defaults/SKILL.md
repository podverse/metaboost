---
name: table-sort-defaults
description: Default sort order by column type for sortable tables; use when adding or changing sortable tables or backend list endpoints.
---

# Table Sort Defaults (Boilerplate)

Use this skill when adding or changing sortable tables (ResourceTableWithFilter, TableWithFilter, **TableWithSort**) or backend list endpoints that accept sortBy/sortOrder. Keeps sort indicators and data order consistent with user expectations. For ensuring any table that displays list data supports sorting, see **tables-support-sorting** (`.cursor/skills/tables-support-sorting/SKILL.md`). For persisting sort in a cookie by path (e.g. bucket-detail messages/buckets), see **sort-prefs-cookie-by-path** (`.cursor/skills/sort-prefs-cookie-by-path/SKILL.md`).

This file is the authority for default sort-order rules by column type.

## Default sort order by column type

| Column type | Default order          | Rationale                                                      |
| ----------- | ---------------------- | -------------------------------------------------------------- |
| **String**  | `asc` (A→Z)            | Alphabetical is the natural reading order.                     |
| **Number**  | `asc` (smallest first) | Ascending is conventional unless "latest" is the goal.         |
| **Date**    | `desc` (newest first)  | Lists (events, admins by created) typically show newest first. |

The header icon reflects the **current** sort: up = ascending, down = descending. So string columns should default to asc and show an up arrow on first load.

## Frontend: column defaultSortOrder

- **TableFilterBarColumn** (in `packages/ui`) supports optional `defaultSortOrder?: 'asc' | 'desc'`.
- **ResourceTableWithFilter** and **TableWithFilter** use it when:
  - Setting initial `sortBy`/`sortOrder` in the URL (first sortable column’s default).
  - Deriving `effectiveSortOrder` when the URL has no `sortOrder` (active column’s default).
- If you omit `defaultSortOrder`, legacy behavior is used (default `'desc'`).

When adding or changing a sortable table, set `defaultSortOrder` on each column:

- String columns: `defaultSortOrder: 'asc'`.
- Date columns (e.g. timestamp, createdAt): `defaultSortOrder: 'desc'`.
- Number columns: `defaultSortOrder: 'asc'`.

Example (buckets list, string columns):

```ts
const columns = [
  { id: 'name', label: t('name'), defaultSortOrder: 'asc' as const },
  { id: 'isPublic', label: t('isPublic'), defaultSortOrder: 'asc' as const },
];
```

Example (events, timestamp first):

```ts
const eventColumns = [
  { id: 'timestamp', label: tCommon('eventsTable.timestamp'), defaultSortOrder: 'desc' as const },
  { id: 'actor', label: tCommon('eventsTable.actor'), defaultSortOrder: 'asc' as const },
  // ...
];
```

## Backend: default when sortOrder is missing

When the API receives `sortBy` but no `sortOrder`, default according to the sort field:

- **Date-like fields** (e.g. `createdAt`, `timestamp`): default **DESC**.
- **Other fields** (string, number): default **ASC**.

Examples:

- `packages/orm` **BucketService**: `orderDir = orderBy === 'createdAt' ? 'DESC' : 'ASC'` when sortOrder is undefined.
- `packages/management-orm` **ManagementUserService**: same for admins list.
- **management-api** list controllers (e.g. usersController): when `sortOrder` is missing, use ASC for string fields and DESC for date fields (e.g. `sortBy === 'createdAt' ? 'DESC' : 'ASC'`).

This keeps direct API calls and any URL without `sortOrder` aligned with the same UX.

## Where this is implemented

- **UI types**: `packages/ui/src/components/table/TableFilterBar/TableFilterBar.tsx` — `TableFilterBarColumn.defaultSortOrder`.
- **Table components**: `packages/ui/src/components/table/ResourceTableWithFilter/ResourceTableWithFilter.tsx`, `packages/ui/src/components/table/TableWithFilter/TableWithFilter.tsx` — initial effect and `effectiveSortOrder` fallback.
- **Pages**: Column arrays in list pages (e.g. `apps/web/.../buckets/page.tsx`, `apps/management-web/.../admins/page.tsx`, `users/page.tsx`, `buckets/page.tsx`, `events/page.tsx`).
- **Backend**: `packages/orm/src/services/BucketService.ts`, `packages/management-orm/src/services/ManagementUserService.ts`, `apps/management-api/src/controllers/usersController.ts` (and any other list endpoint that accepts sortBy/sortOrder).
