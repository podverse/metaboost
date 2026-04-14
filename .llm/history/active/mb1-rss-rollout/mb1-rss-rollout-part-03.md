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
