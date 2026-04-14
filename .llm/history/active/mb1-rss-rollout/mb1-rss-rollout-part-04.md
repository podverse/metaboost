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

### Session 45 - 2026-04-13

#### Prompt (Developer)

this component should be reusable in some way and this will be the only implementation of it for now. implement it.

#### Key Decisions

- Replace the one-off create bucket type dropdown with a reusable UI component so the pattern can be
  reused later while keeping this as its first implementation.
- Add reusable `OptionTileSelector` in `@metaboost/ui` with two-up flexible tile layout, square tiles,
  icon + label vertical composition, and accessible radio-group semantics.
- Update bucket create form to use the reusable selector and set `rss-channel` as the default selected
  type.
- Use Font Awesome icons in the selector options:
  `fa-solid fa-rss` for RSS Channel and `fa-solid fa-users` for Group.
- Keep the description text below selector dynamic based on selected type, preserving current form
  behavior.
- Update affected web E2E specs to use radio-group interactions and the new default-selected RSS flow.
- Add Storybook coverage for the new reusable selector component.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-04.md
- packages/ui/src/components/form/OptionTileSelector/OptionTileSelector.tsx
- packages/ui/src/components/form/OptionTileSelector/OptionTileSelector.module.scss
- packages/ui/src/components/form/OptionTileSelector/OptionTileSelector.stories.tsx

### Session 48 - 2026-04-13

#### Prompt (Developer)

the RSS Network icon should not be users. it should be something else that denotes a "network" or "group" but the current icon makes it look like a group of users which is confusing

#### Key Decisions

- Replace the RSS Network option icon with `fa-diagram-project` to communicate network topology
  instead of people.
- Keep RSS Channel as `fa-rss`; only the RSS Network visual changed.
- Update both runtime usage and Storybook sample so docs and implementation stay aligned.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-04.md
- apps/web/src/app/(main)/buckets/BucketForm.tsx
- packages/ui/src/components/form/OptionTileSelector/OptionTileSelector.stories.tsx

### Session 49 - 2026-04-13

#### Prompt (Developer)

the buckets table should also include the type of the bucket at the end (RSS Channel or RSS Network) as a column

#### Key Decisions

- Add a dedicated `Type` column at the end of the buckets list table and map API bucket type
  values to localized labels (`RSS Network`, `RSS Channel`, `RSS Item`).
- Keep table sorting behavior stable by limiting sortable columns to existing supported fields
  (`name`, `isPublic`) while rendering `type` as display-only.
- Extend i18n with bucket type/value labels needed for table rendering in both English and Spanish.
- Update bucket-owner E2E coverage to assert the `Type` column header and visible RSS type values.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-04.md
- apps/web/src/app/(main)/buckets/page.tsx
- apps/web/src/components/BucketsTableWithFilter.tsx
- apps/web/i18n/originals/en-US.json
- apps/web/i18n/originals/es.json
- apps/web/i18n/overrides/es.json
- apps/web/e2e/buckets-bucket-owner.spec.ts

### Session 50 - 2026-04-13

#### Prompt (Developer)

add a gear icon to the right of the "Recent" dropdown filter. it should display in the dropdown the only option "Show unverified messages" with the checkbox.

#### Key Decisions

- Replace the inline “Show unverified messages” checkbox with a gear-triggered filters dropdown
  positioned to the right of the messages sort select.
- Keep the dropdown content intentionally minimal with one checkbox option:
  “Show unverified messages”.
- Add click-outside close behavior for the filters dropdown so the popover dismisses naturally.
- Add a dedicated i18n label (`messagesFilters`) used for the gear button accessibility label.
- Update owner/admin E2E flows to open the message filters dropdown before toggling the checkbox.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-04.md
- apps/web/src/app/(main)/bucket/[id]/MessagesHeaderControls.tsx
- apps/web/src/app/(main)/bucket/[id]/MessagesHeaderControls.module.scss
- apps/web/src/app/(main)/bucket/[id]/page.tsx
- apps/web/i18n/originals/en-US.json
- apps/web/i18n/originals/es.json
- apps/web/i18n/overrides/es.json
- apps/web/e2e/bucket-rss-messages-unverified-toggle-bucket-owner.spec.ts
- apps/web/e2e/bucket-rss-messages-unverified-toggle-bucket-admin.spec.ts
- packages/ui/src/components/form/OptionTileSelector/index.ts
- packages/ui/src/index.ts
- apps/web/src/app/(main)/buckets/BucketForm.tsx
- apps/web/e2e/buckets-new-bucket-owner.spec.ts
- apps/web/e2e/bucket-create-rss-channel-bucket-owner.spec.ts

### Session 46 - 2026-04-13

#### Prompt (Developer)

@/Users/mitcheldowney/.cursor/projects/Users-mitcheldowney-repos-pv-podverse-ansible/terminals/15.txt:456-473 debug

#### Key Decisions

- Fix the Sass build failure by replacing non-existent `$font-size-xxl` token with existing
  `$font-size-lg` in the reusable selector icon style.
- Verify fix with targeted UI + web type-check.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-04.md
- packages/ui/src/components/form/OptionTileSelector/OptionTileSelector.module.scss

### Session 47 - 2026-04-13

#### Prompt (Developer)

Rename Bucket Type to RSS Network

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Applied a hard cutover from `group` to `rss-network` for the bucket-type concept in DB schema,
  ORM, API contracts, shared request types, web runtime guards, i18n labels, tests, and stories.
- Added `infra/k8s/base/db/postgres-init/0008_bucket_type_rss_network_rename.sql` as the backfill
  path (`group` -> `rss-network`) and wired it into the DB init ConfigMap.
- Renamed ORM service helper usage from `createGroup` to `createRssNetwork` and updated all API test
  call sites accordingly.
- Updated user-facing bucket-type wording to `RSS Network` / `Red RSS` and aligned create-flow E2E
  assertions with the renamed selector option.
- Completed a residual usage audit; remaining `group` usages are only non-bucket-type contexts or the
  migration backfill script itself.
- Did not run test suites in-agent per repository rule; left scoped verification commands for the user.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-04.md
- infra/k8s/base/db/postgres-init/0003_app_schema.sql
- infra/k8s/base/db/postgres-init/0008_bucket_type_rss_network_rename.sql
- infra/k8s/base/db/kustomization.yaml
- packages/orm/src/entities/Bucket.ts
- packages/orm/src/services/BucketService.ts
- apps/api/src/schemas/buckets.ts
- apps/api/src/controllers/bucketsController.ts
- packages/helpers-requests/src/types/bucket-types.ts
- packages/helpers-requests/src/web/buckets.ts
- packages/helpers-requests/dist/types/bucket-types.d.ts
- packages/helpers-requests/dist/web/buckets.d.ts
- apps/web/src/app/(main)/buckets/BucketForm.tsx
- apps/web/src/app/(main)/bucket/[id]/page.tsx
- apps/web/src/app/(main)/bucket/[id]/new/page.tsx
- apps/web/src/app/(main)/bucket/[id]/bucket/new/page.tsx
- apps/web/i18n/originals/en-US.json
- apps/web/i18n/originals/es.json
- apps/web/i18n/overrides/es.json
- apps/api/src/test/buckets.test.ts
- apps/api/src/test/mb1-spec-contract.test.ts
- apps/web/e2e/bucket-create-rss-channel-bucket-owner.spec.ts
- apps/web/e2e/buckets-new-bucket-owner.spec.ts
- packages/ui/src/components/form/OptionTileSelector/OptionTileSelector.stories.tsx
