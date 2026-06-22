---
name: routing-url-params
description: Enforces URL query param handling across pages. Use when adding or updating list/detail filters, pagination, or sorting. Keep URLs clean by not auto-inserting params; only preserve params when the user navigates with them, and remove defaults from the URL.
---

# Routing URL Params

## Instructions

- Do not auto-insert query params into the URL on initial render.
- Only keep query params if the user navigated with them (typed or landed on a URL containing them).
- When params are at default values, remove them from the URL (e.g., `page=1`, default sort key).
- Keep internal state for defaults; only reflect non-defaults in the URL.
- Apply this rule consistently across list and detail pages in **web** and **management-web**.

## Defaults and clearing

- If `page` is 1, it should not appear in the URL.
- If `sort` is the default (e.g., `recent`), it should not appear in the URL.
- If a user changes filters back to defaults, clear those params from the URL.

## Pagination and sorting behavior

- Pagination and sorting should still work even when the URL is clean.
- When the user explicitly changes filters/pagination, update internal state first; only update the URL if the value is non-default.

## Examples

**Good (clean URL)**

- `/buckets` (defaults: page 1, default sort)

**Good (user-specified)**

- `/buckets?page=2&sort=oldest`

**Good (clear defaults after change)**

- User selects default sort → remove `sort` param.
- User returns to page 1 → remove `page` param.

**Bad (auto-inserting defaults)**

- `/buckets?page=1&sort=recent` after initial load

## Related

- **e2e-url-state-contracts** — E2E expectations for URL state
- **sort-prefs-cookie-by-path** — table sort prefs that may complement URL state
