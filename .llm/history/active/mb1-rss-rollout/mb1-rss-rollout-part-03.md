### Session 21 - 2026-04-13

#### Prompt (Developer)

review that plan file and the other plan files and make sure they are up to date and handle boost vs stream successfully. align everything beyond that however you think is appropriate

#### Key Decisions

- Align completed contract and active rollout plans so `boost` vs `stream` behavior is consistent:
  stream telemetry may be persisted but is excluded from all current message retrieval/display paths.
- Update active plan phases to reference the completed contract file as the canonical baseline.
- Update ingestion/public-message/test/checklist plans to explicitly cover:
  - `action='boost' | 'stream'` handling
  - boost-only retrieval semantics
  - MB1 standard prefixless paths with MetaBoost `/v1/s/mb1` mapping.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-03.md
- .llm/plans/completed/mb1-rss-rollout/01-MB1-SPEC-CONTRACT.md
- .llm/plans/active/mb1-rss-rollout/00-SUMMARY.md
- .llm/plans/active/mb1-rss-rollout/00-EXECUTION-ORDER.md
- .llm/plans/active/mb1-rss-rollout/02-DATA-MODEL-AND-MIGRATIONS.md
- .llm/plans/active/mb1-rss-rollout/06-API-BOOST-MB1-INGEST-AND-CONFIRM.md
- .llm/plans/active/mb1-rss-rollout/07-API-PUBLIC-MESSAGES-ENDPOINTS.md
- .llm/plans/active/mb1-rss-rollout/09-WEB-RSS-VERIFICATION-AND-MESSAGE-FILTERING.md
- .llm/plans/active/mb1-rss-rollout/11-TESTS-AND-DOCS-CHECKLIST.md
- .llm/plans/active/mb1-rss-rollout/12-TEST-FILE-MAPPING-AND-MATRIX.md
- .llm/plans/active/mb1-rss-rollout/13-WEB-PUBLIC-HOW-TO-PAGES.md

### Session 24 - 2026-04-13

#### Prompt (Developer)

@metaboost/.llm/plans/active/mb1-rss-rollout/COPY-PASTA.md:17-18

#### Key Decisions

- Implement only plan `02-DATA-MODEL-AND-MIGRATIONS.md` scope (schema/ORM/service data model changes), with no plan-file edits.
- Add bucket type to the schema/entity with enforceable DB checks where practical (`rss-item` requires parent) and leave deeper hierarchy enforcement for service/integration layers.
- Expand RSS channel/item metadata structures to include parse/verify and item lifecycle fields required by later verify/sync phases.
- Add MB1 tracking fields to `bucket_message` including `message_guid`, verification/action metadata, and supporting indexes for retrieval/filter behavior.
- Align source migrations and combined init SQL entrypoints with the same core schema shape so local/k8s init paths remain consistent.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-03.md
- infra/database/migrations/0000_init_helpers.sql
- infra/database/migrations/0003_bucket_schema.sql
- infra/k8s/base/stack/postgres-init/0003_app_schema.sql
- infra/k8s/base/db/postgres-init/0003_app_schema.sql
- packages/orm/src/entities/Bucket.ts
- packages/orm/src/entities/BucketRSSChannelInfo.ts
- packages/orm/src/entities/BucketRSSItemInfo.ts
- packages/orm/src/entities/BucketMessage.ts
- packages/orm/src/services/BucketService.ts
- packages/orm/src/services/BucketRSSChannelInfoService.ts
- packages/orm/src/services/BucketRSSItemInfoService.ts
- packages/orm/src/index.ts

### Session 25 - 2026-04-13

#### Prompt (Developer)

Consolidate SQL To infra/k8s/base/db

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Make `infra/k8s/base/db/postgres-init/` the canonical SQL source and remove direct SQL usage from
  `infra/database/` and `infra/management-database/`.
- Repoint runtime/test/CI schema consumers (docker compose, test make targets, CI workflow) to base/db
  SQL paths.
- Remove stack SQL duplication by having stack kustomization reference canonical base/db SQL and
  deleting duplicated stack SQL files.
- Refactor combine/verify tooling to validate canonical base/db SQL and only synchronize/check stack
  shell wrappers.
- Deprecate legacy SQL directories via README placeholders after deleting obsolete SQL files.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-03.md
- infra/docker/local/docker-compose.yml
- infra/k8s/base/db/kustomization.yaml
- infra/k8s/base/stack/kustomization.yaml
- infra/k8s/base/db/postgres-init/0007_seed_local_user.sql
- infra/k8s/base/stack/postgres-init/0003_app_schema.sql
- infra/k8s/base/stack/postgres-init/0005_management_schema.sql.frag
- scripts/database/combine-migrations.sh
- scripts/database/verify-migrations-combined.sh
- makefiles/local/Makefile.local.k3d.mk
- makefiles/local/Makefile.local.test.mk
- makefiles/local/Makefile.local.e2e.mk
- makefiles/local/Makefile.local.env.mk
- makefiles/local/Makefile.local.docker.mk
- .github/workflows/ci.yml
- apps/api/src/test/setup.ts
- AGENTS.md
- infra/INFRA.md
- infra/k8s/INFRA-K8S.md
- infra/docker/local/INFRA-DOCKER-LOCAL.md
- packages/helpers/src/db/field-lengths.ts
- packages/helpers/PACKAGES-HELPERS.md
- packages/orm/src/constants.ts
- packages/orm/PACKAGES-ORM.md
- packages/management-orm/src/data-source.ts
- scripts/local-env/local-management-db.sh
- .cursor/skills/api-testing/SKILL.md
- .cursor/skills/roles-schema-sync/SKILL.md
- .cursor/skills/generate-data-sync/SKILL.md
- .cursor/skills/database-schema-naming/SKILL.md
- .cursor/skills/argocd-gitops-push/SKILL.md
- infra/database/migrations/0000_init_helpers.sql
- infra/database/migrations/0001_user_schema.sql
- infra/database/migrations/0002_refresh_token.sql
- infra/database/migrations/0003_bucket_schema.sql
- infra/database/combined/01_create_users.sh
- infra/database/combined/seed_local_user.sql
- infra/management-database/migrations/0000_management_helpers.sql
- infra/management-database/migrations/0001_management_user.sql
- infra/management-database/migrations/0002_admin_permissions.sql
- infra/management-database/migrations/0003_management_event.sql
- infra/management-database/migrations/0004_management_refresh_token.sql
- infra/management-database/migrations/0005_management_admin_role.sql
- infra/database/README.md
- infra/management-database/README.md

### Session 22 - 2026-04-13

#### Prompt (Developer)

Fix Local Postgres Init Domain Blocker

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Fix immediately before continuing plan execution because local Postgres init fails during
  `local_infra_up`; this is a blocker, not a deferred later-plan change.
- Add missing SQL helper domains `varchar_medium` and `varchar_url` in the mounted init file so the
  new RSS/MB1 schema columns can be created.
- Validate infra bring-up after clean volume reset; confirm Postgres/Valkey/pgAdmin start healthy.
- In agent environment, use `./scripts/nix/with-env` for `make local_infra_up` so `node` is available
  for the super-admin creation step.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-03.md
- infra/k8s/base/stack/postgres-init/0003_app_schema.sql

### Session 23 - 2026-04-13

#### Prompt (Developer)

Enforce Hard-Replacement MB1 Plans

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Enforce a top-level no-backwards-compatibility policy across the active MB1 rollout plans:
  hard replacement only, no fallback aliases/redirects.
- Remove transitional compatibility wording in the data-model/migration plan and keep wording aligned to
  final target-state behavior.
- Add hard-replacement constraints to API/web phase plans and explicit no-compat validation criteria in
  test checklist/matrix plans (404/absent assertions for removed surfaces).
- Run a cross-file wording sweep to confirm consistency and absence of contradictory compatibility language.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-03.md
- .llm/plans/active/mb1-rss-rollout/00-SUMMARY.md
- .llm/plans/active/mb1-rss-rollout/00-EXECUTION-ORDER.md
- .llm/plans/active/mb1-rss-rollout/COPY-PASTA.md
- .llm/plans/active/mb1-rss-rollout/02-DATA-MODEL-AND-MIGRATIONS.md
- .llm/plans/active/mb1-rss-rollout/04-API-BUCKET-CREATION-RSS-CHANNEL-GROUP.md
- .llm/plans/active/mb1-rss-rollout/05-API-RSS-VERIFY-AND-SYNC-ITEM-BUCKETS.md
- .llm/plans/active/mb1-rss-rollout/06-API-BOOST-MB1-INGEST-AND-CONFIRM.md
- .llm/plans/active/mb1-rss-rollout/07-API-PUBLIC-MESSAGES-ENDPOINTS.md
- .llm/plans/active/mb1-rss-rollout/08-WEB-BUCKET-CREATION-AND-RSS-TABS.md
- .llm/plans/active/mb1-rss-rollout/09-WEB-RSS-VERIFICATION-AND-MESSAGE-FILTERING.md
- .llm/plans/active/mb1-rss-rollout/11-TESTS-AND-DOCS-CHECKLIST.md
- .llm/plans/active/mb1-rss-rollout/12-TEST-FILE-MAPPING-AND-MATRIX.md
- .llm/plans/active/mb1-rss-rollout/13-WEB-PUBLIC-HOW-TO-PAGES.md

### Session 26 - 2026-04-13

#### Prompt (Developer)

review @metaboost/.llm/plans/active/mb1-rss-rollout/02-DATA-MODEL-AND-MIGRATIONS.md determine if
it is completed, finish if it isn't, else move to completed

#### Key Decisions

- Reviewed plan `02-DATA-MODEL-AND-MIGRATIONS.md` against implemented schema/entity/service changes
  and determined it is complete for its scoped data-model/migration objectives.
- Archived the plan by moving it from active to completed without altering its contents.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-03.md
- .llm/plans/active/mb1-rss-rollout/02-DATA-MODEL-AND-MIGRATIONS.md
- .llm/plans/completed/mb1-rss-rollout/02-DATA-MODEL-AND-MIGRATIONS.md

### Session 27 - 2026-04-13

#### Prompt (Developer)

@COPY-PASTA.md (22-23)

#### Key Decisions

- Implement plan 03 by creating a new workspace package `@metaboost/rss-parser-minimal` with:
  permissive RSS extraction, normalization with GUID de-dupe (newest pubDate wins), feed hashing, and
  structured parser errors.
- Keep parser business-rule agnostic (validation left to API/service layer) while still surfacing
  explicit parse/input/structure errors.
- Add unit tests covering all scenarios listed in the plan and archive plan 03 from active to completed
  after implementation.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-03.md
- package.json
- package-lock.json
- packages/rss-parser-minimal/package.json
- packages/rss-parser-minimal/tsconfig.json
- packages/rss-parser-minimal/vitest.config.ts
- packages/rss-parser-minimal/src/types.ts
- packages/rss-parser-minimal/src/errors.ts
- packages/rss-parser-minimal/src/hashFeedContent.ts
- packages/rss-parser-minimal/src/parseMinimalRss.ts
- packages/rss-parser-minimal/src/normalizeMinimalRss.ts
- packages/rss-parser-minimal/src/index.ts
- packages/rss-parser-minimal/src/index.test.ts
- .llm/plans/active/mb1-rss-rollout/03-MINIMAL-RSS-PARSER-PACKAGE.md
- .llm/plans/completed/mb1-rss-rollout/03-MINIMAL-RSS-PARSER-PACKAGE.md

### Session 28 - 2026-04-13

#### Prompt (Developer)

change the name from rss-parser-minimal to rss-parser

#### Key Decisions

- Rename package identity and workspace path from `rss-parser-minimal` to `rss-parser`.
- Keep implementation behavior unchanged; only rename package metadata/path and related root workspace
  script references.
- Preserve plan/history integrity by recording rename work in a new session while leaving prior session
  records intact.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-03.md
- package.json
- package-lock.json
- .llm/plans/completed/mb1-rss-rollout/03-MINIMAL-RSS-PARSER-PACKAGE.md
- packages/rss-parser/package.json
- packages/rss-parser/tsconfig.json
- packages/rss-parser/vitest.config.ts
- packages/rss-parser/src/types.ts
- packages/rss-parser/src/errors.ts
- packages/rss-parser/src/hashFeedContent.ts
- packages/rss-parser/src/normalizeMinimalRss.ts
- packages/rss-parser/src/parseMinimalRss.ts
- packages/rss-parser/src/index.ts
- packages/rss-parser/src/index.test.ts
- packages/rss-parser-minimal/package.json
- packages/rss-parser-minimal/tsconfig.json
- packages/rss-parser-minimal/vitest.config.ts
- packages/rss-parser-minimal/src/types.ts
- packages/rss-parser-minimal/src/errors.ts
- packages/rss-parser-minimal/src/hashFeedContent.ts
- packages/rss-parser-minimal/src/normalizeMinimalRss.ts
- packages/rss-parser-minimal/src/parseMinimalRss.ts
- packages/rss-parser-minimal/src/index.ts
- packages/rss-parser-minimal/src/index.test.ts

### Session 29 - 2026-04-13

#### Prompt (Developer)

@/Users/mitcheldowney/.cursor/projects/Users-mitcheldowney-repos-pv-pv-code-workspace/terminals/15.txt:440-572 debug

#### Key Decisions

- Fix management-api compile failure by aligning serializer type with current nullable
  `BucketMessage.senderName`.
- Treat `.next/dev/types` parse failures as generated-artifact instability and harden web/management-web
  type-check scripts to remove that subtree after `next typegen` before `tsc --noEmit`.
- Keep Next route type generation enabled (`next typegen`) so `.next/types` remains part of checks while
  avoiding broken `.next/dev/types` output.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-03.md
- apps/management-api/src/lib/messageToJson.ts
- apps/web/package.json
- apps/management-web/package.json
- apps/web/tsconfig.json
- apps/management-web/tsconfig.json

### Session 30 - 2026-04-13

#### Prompt (Developer)

implement @metaboost/.llm/plans/active/mb1-rss-rollout/04-API-BUCKET-CREATION-RSS-CHANNEL-GROUP.md

#### Key Decisions

- Enforce hard-replacement bucket-create contracts in API schemas: top-level create now requires explicit
  `type` and type-specific fields, and child create accepts only `rss-channel` with `rssFeedUrl`.
- Implement RSS channel bootstrap in API controller by fetching + parsing feed URL with
  `@metaboost/rss-parser`, requiring channel title and podcast guid, deriving bucket name from channel
  title, and returning 400 validation details on RSS field failures.
- Add ORM service helpers for explicit group/rss-channel create and child-type checks; add RSS channel
  info lookup by podcast guid to prevent duplicate channel bootstrap.
- Extend bucket responses to include `type` and RSS metadata/status payload for rss-channel buckets.
- Expand API integration tests for top-level and child creation matrix plus validation and parent-type
  restrictions.
- Archive plan 04 from active to completed after implementation.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-03.md
- apps/api/package.json
- apps/api/src/controllers/bucketsController.ts
- apps/api/src/lib/bucket-response.ts
- apps/api/src/schemas/buckets.ts
- apps/api/src/test/buckets.test.ts
- package-lock.json
- packages/orm/src/services/BucketService.ts
- packages/orm/src/services/BucketRSSChannelInfoService.ts
- .llm/plans/active/mb1-rss-rollout/04-API-BUCKET-CREATION-RSS-CHANNEL-GROUP.md
- .llm/plans/completed/mb1-rss-rollout/04-API-BUCKET-CREATION-RSS-CHANNEL-GROUP.md

### Session 31 - 2026-04-13

#### Prompt (Developer)

Fix `xml` Dead Assignment in Bucket RSS Parse

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as
you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Fix the dead-assignment diagnostic immediately by removing the unused initial `''` assignment while
  preserving fetch/parse behavior and existing error mapping.
- Verify the change with API workspace type-check and lint.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-03.md
- apps/api/src/controllers/bucketsController.ts

### Session 32 - 2026-04-13

#### Prompt (Developer)

implement @metaboost/.llm/plans/active/mb1-rss-rollout/05-API-RSS-VERIFY-AND-SYNC-ITEM-BUCKETS.md

#### Key Decisions

- Implement plan 05 with a single authoritative endpoint: `POST /buckets/:bucketId/rss/verify`.
- Add API-level RSS verify/sync module to centralize feed fetch/parse, mb1 tag/path verification, deduped item synchronization, orphan/restore lifecycle, and channel metadata persistence updates.
- Enforce verification failure clarity with explicit missing-tag vs URL-mismatch reasons.
- Add MB1 ingest reparse-on-miss flow: when `item_guid` is missing and last parse is stale, reparse once and retry lookup before returning a clear not-found validation error.
- Add optional config `RSS_PARSE_MIN_INTERVAL_MS` (default 600000 ms).
- Expand integration coverage for verify/sync behavior and reparse-on-miss behavior.
- Mark plan 05 complete by moving it from active to completed unchanged.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-03.md
- apps/api/src/config/index.ts
- apps/api/src/controllers/bucketsController.ts
- apps/api/src/controllers/mb1Controller.ts
- apps/api/src/lib/rss-sync.ts
- apps/api/src/routes/buckets.ts
- apps/api/src/test/buckets.test.ts
- apps/api/src/test/mb1-spec-contract.test.ts
- packages/orm/src/services/BucketRSSItemInfoService.ts
- packages/orm/src/services/BucketService.ts
- .llm/plans/active/mb1-rss-rollout/05-API-RSS-VERIFY-AND-SYNC-ITEM-BUCKETS.md
- .llm/plans/completed/mb1-rss-rollout/05-API-RSS-VERIFY-AND-SYNC-ITEM-BUCKETS.md

### Session 33 - 2026-04-13

#### Prompt (Developer)

it looks like the env related files should have RSS_PARSE_MIN_INTERVAL_MS set with a default even though the config js has its own default but we want to see it in env files for clarity

#### Key Decisions

- Make `RSS_PARSE_MIN_INTERVAL_MS` explicit in env classification and visible env-facing files for clarity.
- Keep default value aligned at `600000` (10 minutes) across classification, local API env, remote-k8s overlay, and API test setup.
- Document the variable in `ENV-REFERENCE.md` so the default and behavior are discoverable.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-03.md
- infra/env/classification/base.yaml
- infra/env/overrides/remote-k8s.yaml
- apps/api/.env
- apps/api/src/test/setup.ts
- docs/development/ENV-REFERENCE.md

### Session 34 - 2026-04-13

#### Prompt (Developer)

implement @metaboost/.llm/plans/active/mb1-rss-rollout/06-API-BOOST-MB1-INGEST-AND-CONFIRM.md

#### Key Decisions

- Enforce MB1 ingest target requirement to RSS channel buckets by returning not-found for non-rss-channel bucket short IDs.
- Persist `action='stream'` submissions as telemetry rows (with MB1 metadata) while still returning `message_sent=false` and no display `message_guid` response.
- Update confirm-payment bucket-context validation so message GUIDs under rss-item child buckets of the resolved channel are accepted.
- Extend integration coverage for non-rss-channel capability rejection, stream telemetry persistence semantics, and confirm-payment idempotency under item-scoped routing.
- Keep MB1 OpenAPI wording aligned with telemetry persistence semantics for stream responses.
- Mark plan 06 complete by moving it from active to completed unchanged.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-03.md
- apps/api/src/controllers/mb1Controller.ts
- apps/api/src/test/mb1-spec-contract.test.ts
- apps/api/src/openapi-mb1.ts
- packages/orm/src/services/BucketRSSItemInfoService.ts
- .llm/plans/active/mb1-rss-rollout/06-API-BOOST-MB1-INGEST-AND-CONFIRM.md
- .llm/plans/completed/mb1-rss-rollout/06-API-BOOST-MB1-INGEST-AND-CONFIRM.md

### Session 35 - 2026-04-13

#### Prompt (Developer)

implement @metaboost/.llm/plans/active/mb1-rss-rollout/07-API-PUBLIC-MESSAGES-ENDPOINTS.md

#### Key Decisions

- Keep canonical MB1 public message endpoints (`/v1/s/mb1/messages/public/...`) as the only active public message-read surface and hard-remove legacy `/v1/buckets/public/:id/messages`.
- Preserve verified-only + boost-only + reverse-chronological behavior for all MB1 public message list endpoints.
- Extend integration coverage for public-disabled access, invalid channel/item filters, descending order, metadata field availability, and empty result behavior.
- Align MB1 OpenAPI docs to explicitly describe verified-only semantics and public message metadata fields.
- Mark plan 07 complete by moving it from active to completed unchanged.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-03.md
- apps/api/src/routes/buckets.ts
- apps/api/src/test/buckets.test.ts
- apps/api/src/test/mb1-spec-contract.test.ts
- apps/api/src/openapi-mb1.ts
- .llm/plans/active/mb1-rss-rollout/07-API-PUBLIC-MESSAGES-ENDPOINTS.md
- .llm/plans/completed/mb1-rss-rollout/07-API-PUBLIC-MESSAGES-ENDPOINTS.md

### Session 36 - 2026-04-13

#### Prompt (Developer)

implement @metaboost/.llm/plans/active/mb1-rss-rollout/08-WEB-BUCKET-CREATION-AND-RSS-TABS.md

#### Key Decisions

- Implement the web create flow as a hard replacement contract: top-level create supports `group` and `rss-channel`, while child create under a group supports only `rss-channel` with `rssFeedUrl`.
- Enforce type-based child-create restrictions in the web app: routes and create affordances are hidden/blocked for non-group buckets (`rss-channel`, `rss-item`).
- Add `add-to-rss` as an explicit bucket-detail tab state for `rss-channel` buckets and redirect new RSS channel creations to that tab.
- Move API calls for bucket creation to `@metaboost/helpers-requests` via new `reqPostCreateBucket` and `reqPostCreateChildBucket` helpers.
- Add dedicated E2E coverage for RSS-channel creation flows and update existing child/nested create specs to the RSS URL contract.
- Archive plan 08 by moving it from active to completed.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-03.md
- .llm/plans/active/mb1-rss-rollout/08-WEB-BUCKET-CREATION-AND-RSS-TABS.md
- .llm/plans/completed/mb1-rss-rollout/08-WEB-BUCKET-CREATION-AND-RSS-TABS.md
- packages/helpers-requests/src/types/bucket-types.ts
- packages/helpers-requests/src/web/buckets.ts
- apps/web/src/lib/routes.ts
- apps/web/src/app/(main)/buckets/BucketForm.tsx
- apps/web/src/app/(main)/buckets/TopicForm.tsx
- apps/web/src/app/(main)/bucket/[id]/new/page.tsx
- apps/web/src/app/(main)/bucket/[id]/bucket/new/page.tsx
- apps/web/src/app/(main)/bucket/[id]/page.tsx
- apps/web/i18n/originals/en-US.json
- apps/web/i18n/originals/es.json
- apps/web/e2e/bucket-create-rss-channel-bucket-owner.spec.ts
- apps/web/e2e/bucket-child-new-bucket-owner.spec.ts
- apps/web/e2e/bucket-child-new-bucket-admin.spec.ts
- apps/web/e2e/bucket-nested-new-bucket-owner.spec.ts
- apps/web/e2e/bucket-nested-new-bucket-admin.spec.ts
- apps/web/public/e2e/rss/mb1-channel-01.xml
- apps/web/public/e2e/rss/mb1-channel-02.xml
- apps/web/public/e2e/rss/mb1-channel-03.xml
- apps/web/public/e2e/rss/mb1-channel-04.xml
- makefiles/local/e2e-spec-order-web.txt

### Session 37 - 2026-04-13

#### Prompt (Developer)

implement @metaboost/.llm/plans/active/mb1-rss-rollout/09-WEB-RSS-VERIFICATION-AND-MESSAGE-FILTERING.md

#### Key Decisions

- Implement Add to RSS tab as a first-class interactive UI with canonical mb1 snippet, copy action, verify button, and verification feedback/status handling.
- Add explicit private message filtering behavior with `includeUnverified` query support: default verified-only; opt-in unverified visibility for owner/admin viewers.
- Enforce public message routes as verified-only + boost-only and keep stream rows excluded from all current message retrieval/display surfaces.
- Extend message rendering on private/public pages to display MB1 metadata fields with localized labels and BTC+sats formatting.
- Extend bucket child API response and web table behavior for `rss-item` metadata (`rssItemPubDate`, `orphaned`) and render rss-item status/pub-date affordances for rss-channel bucket children.
- Add web request helpers for RSS verify action and include-unverified query contract.
- Add/align E2E coverage files for add-to-rss rendering, verify status success/failure, unverified toggle behavior, non-admin no-toggle behavior, and RSS URL-state contract.
- Archive plan 09 by moving it from active to completed.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-03.md
- .llm/plans/active/mb1-rss-rollout/09-WEB-RSS-VERIFICATION-AND-MESSAGE-FILTERING.md
- .llm/plans/completed/mb1-rss-rollout/09-WEB-RSS-VERIFICATION-AND-MESSAGE-FILTERING.md
- apps/api/src/controllers/bucketMessagesController.ts
- apps/api/src/controllers/bucketsController.ts
- apps/web/src/lib/buckets.ts
- apps/web/src/app/(main)/bucket/[id]/AddToRssPanel.tsx
- apps/web/src/app/(main)/bucket/[id]/MessagesHeaderControls.tsx
- apps/web/src/app/(main)/bucket/[id]/page.tsx
- apps/web/src/app/(main)/b/[id]/page.tsx
- packages/helpers-requests/src/types/bucket-types.ts
- packages/helpers-requests/src/web/buckets.ts
- packages/ui/src/components/bucket/BucketMessageList/BucketMessageList.tsx
- packages/ui/src/components/bucket/MessageCard/MessageCard.tsx
- packages/ui/src/components/bucket/MessageCard/MessageCard.module.scss
- apps/web/i18n/originals/en-US.json
- apps/web/i18n/originals/es.json
- apps/web/i18n/compiled/en-US.json
- apps/web/i18n/compiled/es.json
- apps/web/e2e/bucket-rss-add-tab-bucket-owner.spec.ts
- apps/web/e2e/bucket-rss-verify-status-bucket-owner.spec.ts
- apps/web/e2e/bucket-rss-messages-unverified-toggle-bucket-owner.spec.ts
- apps/web/e2e/bucket-rss-messages-unverified-toggle-bucket-admin.spec.ts
- apps/web/e2e/bucket-rss-messages-non-admin.spec.ts
- apps/web/e2e/bucket-rss-url-state-contract.spec.ts
- makefiles/local/e2e-spec-order-web.txt
- apps/web/public/e2e/rss/mb1-channel-05.xml
- apps/web/public/e2e/rss/mb1-channel-06.xml
- apps/web/public/e2e/rss/mb1-channel-07.xml
- apps/web/public/e2e/rss/mb1-channel-08.xml
- apps/web/public/e2e/rss/mb1-channel-09.xml
- apps/web/public/e2e/rss/mb1-channel-10.xml

### Session 38 - 2026-04-13

#### Prompt (Developer)

implement @metaboost/.llm/plans/active/mb1-rss-rollout/10-PODVERSE-PUBLIC-RSS-ASSET.md

#### Key Decisions

- Implement plan 10 in the `podverse` repo as scoped: create a static public RSS XML asset with the required mb1 test channel/item fields.
- Add a short Podverse V4V docs note describing file location and the public serving path.
- Keep serving static-only (no runtime code changes) and archive plan 10 from active to completed in Metaboost once implemented.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-03.md
- .llm/plans/active/mb1-rss-rollout/10-PODVERSE-PUBLIC-RSS-ASSET.md
- .llm/plans/completed/mb1-rss-rollout/10-PODVERSE-PUBLIC-RSS-ASSET.md
- ../podverse/.llm/history/active/podverse-public-rss-asset/podverse-public-rss-asset-part-01.md
- ../podverse/apps/web/public/feeds/podverse-boosts-feed.xml
- ../podverse/docs/v4v/README.md

### Session 39 - 2026-04-13

#### Prompt (Developer)

implement @metaboost/.llm/plans/active/mb1-rss-rollout/11-TESTS-AND-DOCS-CHECKLIST.md

#### Key Decisions

- Complete plan 11 as the checklist-definition phase and keep implementation scope limited to that file.
- Preserve phase ordering: plan 12 remains the mandatory mapping artifact, and plan 13 remains the how-to
  page delivery phase.
- Archive plan 11 from `active` to `completed` after confirming scope completion.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-03.md
- .llm/plans/active/mb1-rss-rollout/11-TESTS-AND-DOCS-CHECKLIST.md
- .llm/plans/completed/mb1-rss-rollout/11-TESTS-AND-DOCS-CHECKLIST.md
