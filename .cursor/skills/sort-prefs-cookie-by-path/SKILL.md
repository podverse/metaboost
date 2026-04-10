---
name: sort-prefs-cookie-by-path
description: Persist sort preferences in a cookie keyed by path (not resource ID); restore when URL has no sort params.
---

# Sort Preferences Cookie by Path (Metaboost)

Use this skill when adding or changing sort UI (messages recent/oldest, table sortBy/sortOrder). Persist the user's last choice in a cookie keyed by **path** (e.g. `bucket-detail-messages`, `bucket-detail-buckets`), not by resource ID. Restore when the URL has no sort param(s).

This file is the authority for sort preference persistence and restore behavior.

**First-paint / no flash:** Prefer restoring from the cookie on the **server** (redirect when URL has no sort params) so the first paint shows the correct sort and there is no flash of unsorted content. Use server-safe helpers (`getMessagesSortFromCookieValue`, `getSortPrefsFromCookieValue`) in the page and `redirect()` before fetching data. Keep client-side restore in TableWithSort and MessagesSortSelect for in-app navigation.

## Path-based keys

- Cookie keys are path descriptors so the same preference applies to every page of that type (e.g. every bucket detail messages tab).
- Do not put resource IDs (e.g. bucket ID) in the key.

## Table sort (sortBy / sortOrder)

Implement at the **table** level via **TableWithSort** so any sortable table can opt in:

- Pass optional `sortPrefsCookieName`, `sortPrefsListKey` (path-based, e.g. `bucket-detail-buckets`), and `getSortUrl(sortBy, sortOrder)`.
- TableWithSort handles: restore (effect when URL has no sortBy/sortOrder → read cookie → `router.replace(getSortUrl(...))`) and save (on header click → write cookie → `onSortChange(sortKey, nextOrder)`).
- Parent only builds the URL and navigates; `onSortChange` has signature `(sortKey: string, nextOrder: 'asc' | 'desc') => void`.

## Messages-style sort (recent / oldest)

Implement in the component that owns the select (e.g. **MessagesSortSelect**):

- Optional prop `sortPrefsCookieName`. When set: restore (effect when URL has no `sort` → read cookie → if `'oldest'`, `router.replace` with `sort=oldest`); save (on change → `setMessagesSortInCookie` then `router.push`).
- Helpers: `getMessagesSortFromCookie(cookieName)`, `setMessagesSortInCookie(cookieName, sort)` from `@metaboost/ui` (key `bucket-detail-messages`).

## Same app cookie

Use the same app cookie as other table sort prefs (`TABLE_SORT_PREFS_COOKIE_NAME` / `management_table_sort_prefs`). Add path-based list keys as needed. Cookie value is a map; keys include `bucket-detail-messages` (value `{ sort: 'recent' | 'oldest' }`) and `bucket-detail-buckets` (value `SortPref`).

## See also

- **table-sort-defaults** — default sort order by column type.
- **tables-support-sorting** — ensuring tables support sorting.
