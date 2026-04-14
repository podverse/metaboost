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
- .llm/plans/active/mb1-rss-rollout/COPY-PASTA.md

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
