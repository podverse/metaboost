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

### Session 42 - 2026-04-13

#### Prompt (Developer)

@/Users/mitcheldowney/.cursor/projects/Users-mitcheldowney-repos-pv-pv-code-workspace/terminals/15.txt:1782-1899 debug

#### Key Decisions

- Resolve the reported `@metaboost/web` type-check failures directly in the two flagged files from the terminal output.
- Remove unused imports and restore missing `Row` import in bucket detail page.
- Extend page search param typing to include `includeUnverified` so query parsing compiles.
- Fix `ApiResponse` narrowing in `TopicForm` by handling `!res.ok` and `res.data?.bucket` in separate branches.
- Verify with a scoped web workspace type-check.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-04.md
- apps/web/src/app/(main)/bucket/[id]/page.tsx
- apps/web/src/app/(main)/buckets/TopicForm.tsx

### Session 43 - 2026-04-13

#### Prompt (Developer)

if mb1-rss-rollout is complete move the remaining plans to completed

#### Key Decisions

- Confirmed rollout execution is complete through plan 13 and only plan-set index files remained active.
- Move the remaining plan-set files (`00-EXECUTION-ORDER.md`, `00-SUMMARY.md`, `COPY-PASTA.md`) from
  `active` to `completed` to fully archive the mb1-rss-rollout set.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-04.md
- .llm/plans/active/mb1-rss-rollout/00-EXECUTION-ORDER.md
- .llm/plans/active/mb1-rss-rollout/00-SUMMARY.md
- .llm/plans/active/mb1-rss-rollout/COPY-PASTA.md
- .llm/plans/completed/mb1-rss-rollout/00-EXECUTION-ORDER.md
- .llm/plans/completed/mb1-rss-rollout/00-SUMMARY.md
- .llm/plans/completed/mb1-rss-rollout/COPY-PASTA.md

### Session 44 - 2026-04-13

#### Prompt (Developer)

add the missing ones

#### Key Decisions

- Add startup validation coverage in API for optional-but-consumed config vars:
  `API_VERSION_PATH`, `RSS_PARSE_MIN_INTERVAL_MS`, `API_CORS_ORIGINS`, `API_COOKIE_DOMAIN`.
- Add startup validation coverage in management-api for optional-but-consumed config vars:
  `MANAGEMENT_API_VERSION_PATH`, `MANAGEMENT_API_CORS_ORIGINS`,
  `MANAGEMENT_API_COOKIE_DOMAIN`, `WEB_BASE_URL`.
- Add strict `RUNTIME_CONFIG_URL` format/protocol validation in web and management-web runtime-config
  sidecar client loaders so invalid values fail with clear startup errors when used.
- Verify with targeted workspace type-check across API and web apps.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-04.md
- apps/api/src/lib/startup/validation.ts
- apps/management-api/src/lib/startup/validation.ts
- apps/web/src/config/runtime-config.server.ts
- apps/management-web/src/config/runtime-config.server.ts
