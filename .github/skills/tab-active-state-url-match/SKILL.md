---
name: tab-active-state-url-match
description: Ensure Tabs active state works with and without URL params by passing the canonical tab href as activeHref, not a URL with extra query params.
version: 1.0.0
---

# Tab active state and URL matching

**When to use:** When adding or changing tab navigation that uses `Tabs` from `@metaboost/ui` with `exactMatch`, or when the tab URL can have query params (e.g. `?tab=messages`, `?sort=oldest`).

This file is the authority for canonical tab href and `activeHref` matching behavior.

## Rule

For the active tab to be highlighted reliably:

1. **Canonical tab href:** Each tab item's `href` should be the canonical URL for that tab (the base URL users land on when they click the tab, e.g. path only or path + minimal params like `?tab=buckets`).
2. **activeHref must match that href:** When passing `activeHref` to `Tabs`, it must equal the **same** href as the tab item for the current tab. Do **not** pass the full current URL if it includes extra query params (e.g. `sort`, `page`) that are not part of the tab item's href.

Otherwise, with `exactMatch`, `currentHref === item.href` will be false (e.g. `activeHref` is `/bucket/1?tab=messages&sort=oldest` but the Messages tab's href is `/bucket/1`), and no tab will appear active.

## Implementation

- Derive the current tab from the URL (e.g. `searchParams.tab === 'buckets' ? 'buckets' : 'messages'`).
- Set `activeHref` to the **canonical** href for that tab—the same value as the corresponding item in `items` (e.g. when on messages tab use `bucketViewRoute(id)` or `bucketDetailRoute(id)`, not a URL that includes `&sort=oldest` or `&page=2`).

## Checklist

- Are tab items using canonical hrefs (base URL per tab)?
- Is `activeHref` set to the canonical href for the current tab (same as the tab item's href), not the full URL with sort/page/other params?
- When the URL has no tab param, does your default tab match one of the item hrefs (e.g. pathname-only for default tab)?
