---
name: sort-prefs-cookie-by-path
description: Persist list and sort preferences in cookies keyed by path/list id; server reads cookies when URL has no query params; in-app list actions strip the query string and refetch list data via the API with the global async loading overlay (never router.refresh for sort/filter metadata).
---

# Sort and list state cookies (Metaboost)

Use this skill when adding or changing sort UI (messages recent/oldest, table sortBy/sortOrder), search, filters, pagination, bucket detail tabs, or other list metadata.

**Policy:** User actions inside the app must **not** leave sort/filter/pagination/tab metadata in the URL after the user changes a control. Persist state in cookies (plus existing sort-prefs keys where applicable). **Direct or bookmarked URLs** may still include `?…`; the server honors those **`searchParams` on that request** when present. On the **first in-app** change to list metadata, **`router.replace(pathname)`** strips all query params for that page; cookies remain the source of truth afterward.

**Loading UX:** List metadata updates (**sort, filter, search, pagination**) must **not** use **`router.refresh()`**. Use **`useCookieModeListRefresh`** with a parent callback that **calls the HTTP API** with cookie-derived query params and **replaces** displayed rows/state with the response, wrapped by **`runAsyncLoad`** via **`useAsyncPageLoading`** so **`NavigationLoadingOverlay`** shows during the request. Omitting the callback makes **`useCookieModeListRefresh`** fall back to **`router.refresh()`** — avoid that whenever a full RSC reload is unnecessary (including **bucket-detail tab switching**: prefer **client `activeTab`** inside **`BucketDetailTabShell`** and optional **`router.push` with `?tab=`** when context is unavailable; tab is **not** persisted in **`bucket_detail_nav`**). It is **not** acceptable for sort/filter list updates on data tables.

## Path-based keys (sort prefs cookie)

- `TABLE_SORT_PREFS_COOKIE_NAME` / `management_table_sort_prefs`: map keys such as `bucket-detail-messages` (`{ sort }`) and `bucket-detail-buckets` (`SortPref`).
- Same pattern for dashboard/management lists: keys like `dashboard-buckets`, `admins`, `events`, etc.

## Table list state cookie

- **`TABLE_LIST_STATE_COOKIE_NAME`** / **`management_table_list_state`**: JSON map keyed by the same **list key** as sort prefs. Stores optional `search`, `filterColumns`, `page`, and (events) `timelineSort`.
- Server pages merge **URL params first**, then fall back to this cookie when a param is absent.
- Client tables pass **`tableListStateCookieName`** + **`sortPrefsListKey`** into `TableWithFilter` / `ResourceTableWithFilter` and **`onListMetadataChange`** so controls write cookies and **client-fetch** list data instead of pushing query strings or doing a full RSC reload.

## Bucket detail navigation cookie

- **`BUCKET_DETAIL_NAV_COOKIE_NAME`** (per app): map keyed by **bucket pathname** (e.g. `/bucket/shortId`). Stores optional **`messagesPage`**, **`includeBlockedSenderMessages`** — **not** active tab (tab uses **`searchParams.tab`** when present; default tab is Messages when absent).
- Tab links share the same pathname. **Bucket detail (web + management-web):** **`BucketDetailTabShell`** uses **`BucketDetailTabNavContext`** for **`selectTab`** (**URL strip** + client **`activeTab`** without tab cookie); fallback tab clicks **`router.push` with `?tab=`**. Post-create redirects attach **`?tab=add-to-rss`** / **`?tab=endpoint`** as needed. When the user opens **Messages** after landing on another tab, the messages panel **client-fetches** if SSR did not load the list.

## Messages sort

- **`MessagesSortSelect`**: `setMessagesSortInCookie` then shared **`onAfterCookieWrite` / list refetch** — the messages list must **refetch messages from the API** (see web messages tab); do not use **`router.refresh()`** for applying the new sort to message rows.

## See also

- **table-sort-defaults** — default sort order by column type.
- **tables-support-sorting** — ensuring tables support sorting.
