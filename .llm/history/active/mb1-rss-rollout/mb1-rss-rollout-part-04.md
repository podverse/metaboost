### Session 41 - 2026-04-13

#### Prompt (Developer)

implement @metaboost/.llm/plans/active/mb1-rss-rollout/13-WEB-PUBLIC-HOW-TO-PAGES.md

#### Key Decisions

- Keep plan 13 scope focused on public how-to delivery: page content updates, route visibility, i18n, and E2E.
- Expand both pages to five concise steps aligned to MB1 flow requirements, including:
  `action='boost'` vs `action='stream'`, BTC+sats handling, and nullable `amount_unit` guidance.
- Add cross-links and deeper docs links from both pages (terms, creators/developers cross-link, MB1 OpenAPI).
- Keep unauthenticated access on `/how-to/creators` and `/how-to/developers` via public route checks.
- Update how-to E2E coverage and web spec ordering for report consistency.
- Archive plan 13 from `active` to `completed` after implementation.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-04.md
- .llm/plans/active/mb1-rss-rollout/13-WEB-PUBLIC-HOW-TO-PAGES.md
- .llm/plans/completed/mb1-rss-rollout/13-WEB-PUBLIC-HOW-TO-PAGES.md
- apps/web/src/lib/routes.ts
- apps/web/src/app/(main)/how-to/creators/page.tsx
- apps/web/src/app/(main)/how-to/developers/page.tsx
- apps/web/i18n/originals/en-US.json
- apps/web/i18n/originals/es.json
- apps/web/i18n/overrides/es.json
- apps/web/e2e/how-to-pages-public.spec.ts
- makefiles/local/e2e-spec-order-web.txt
