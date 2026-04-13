### Session 1 - 2026-04-13

#### Prompt (Developer)

MB1 RSS Rollout Plan Set

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as
in_progress as you work, starting with the first one. Don't stop until you have completed all
the to-dos.

#### Key Decisions

- Execute this request as plan-file creation only, based on the approved plan set.
- Keep product code unchanged and only create files under `.llm/plans/active/mb1-rss-rollout/`.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-01.md

### Session 10 - 2026-04-13

#### Prompt (Developer)

MB1 Terms URL + Public Terms Page

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress
as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Replace hardcoded MB1 capability terms URL with required env configuration in API config/startup validation.
- Add a public web `/terms` page with explicit MB1/payment/refund responsibility disclaimers.
- Add and expose public `/how-to/creators` and `/how-to/developers` pages and link MB1 docs/pages to `/terms`.
- Add API and E2E coverage for configured terms URL and unauthenticated terms page access.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-01.md
- apps/api/.env
- apps/api/src/config/index.ts
- apps/api/src/controllers/mb1Controller.ts
- apps/api/src/lib/startup/validation.ts
- apps/api/src/test/setup.ts
- docs/MB1-SPEC-CONTRACT.md
- apps/api/src/test/mb1-spec-contract.test.ts
- apps/web/src/lib/routes.ts
- apps/web/src/app/(main)/terms/page.tsx
- apps/web/src/app/(main)/how-to/creators/page.tsx
- apps/web/src/app/(main)/how-to/developers/page.tsx
- apps/web/e2e/terms-unauthenticated.spec.ts
- infra/env/classification/base.yaml
- infra/env/overrides/remote-k8s.yaml
- docs/development/ENV-REFERENCE.md

### Session 9 - 2026-04-13

#### Prompt (Developer)

review @metaboost/.llm/plans/active/mb1-rss-rollout/01-MB1-SPEC-CONTRACT.md and if anything is not
complete or misaligned then complete it

#### Key Decisions

- Align MB1 contract implementation artifacts with active plan requirements for optional `amount_unit`.
- Update schema, MB1 OpenAPI, and MB1 contract docs so the wire contract stays consistent.
- Add test assertions that verify `amount_unit` is accepted by contract endpoints.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-01.md
- apps/api/src/schemas/mb1.ts
- packages/helpers/src/db/field-lengths.ts
- packages/helpers/src/db/index.ts
- packages/helpers/src/index.ts

### Session 8 - 2026-04-13

#### Prompt (Developer)

MEDIUM_TEXT_MAX_LENGTH use that, but the item_guid can potentially be a URL so the max length for
item_guid should be whatever typical max url length is considered

#### Key Decisions

- Add shared helper constants for medium text length and URL length.
- Replace raw `255` usages in MB1 schema with helper constants.
- Use URL-length constant for `item_guid`.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-01.md
- apps/api/src/app.ts
- apps/api/src/lib/api-docs.ts
- apps/api/src/routes/standards.ts

### Session 7 - 2026-04-13

#### Prompt (Developer)

@app.ts (48-51) these should also be moved to some kind of "standards" file, since the /s/ path can
potentially be used for many standards, albeit we only have mb1 for now

#### Key Decisions

- Extract `/s/*` routing into a dedicated standards router module.
- Keep MB1 route behavior unchanged while making standards path extensible.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-01.md
- apps/api/src/app.ts
- apps/api/src/lib/api-docs.ts

### Session 6 - 2026-04-13

#### Prompt (Developer)

api-docs should be handled in their own file and imported for cleanliness

#### Key Decisions

- Extract Swagger/OpenAPI setup out of `app.ts` into a dedicated helper module.
- Keep `app.ts` focused on route composition while preserving existing docs endpoints.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-01.md

### Session 5 - 2026-04-13

#### Prompt (Developer)

MB1 Contract + Display Plan Update

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as
in_progress as you work, starting with the first one. Don't stop until you have completed all
the to-dos.

#### Key Decisions

- Update active MB1 plan files to include optional `amount_unit` with null persistence semantics.
- Extend planning requirements so message UIs display all available MB1 metadata including BTC+sats handling.
- Keep backend error i18n out of scope while adding UI i18n requirements where applicable.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-01.md
- .llm/plans/active/mb1-rss-rollout/01-MB1-SPEC-CONTRACT.md
- apps/api/src/app.ts
- apps/api/src/openapi-mb1.ts
- apps/api/src/test/mb1-spec-contract.test.ts
- docs/MB1-SPEC-CONTRACT.md
- .llm/plans/active/mb1-rss-rollout/01-MB1-SPEC-CONTRACT.md
- .llm/plans/active/mb1-rss-rollout/06-API-BOOST-MB1-INGEST-AND-CONFIRM.md
- .llm/plans/active/mb1-rss-rollout/07-API-PUBLIC-MESSAGES-ENDPOINTS.md
- .llm/plans/active/mb1-rss-rollout/09-WEB-RSS-VERIFICATION-AND-MESSAGE-FILTERING.md
- apps/api/src/app.ts
- apps/api/src/controllers/mb1Controller.ts
- apps/api/src/openapi-mb1.ts
- apps/api/src/openapi.ts
- apps/api/src/routes/mb1.ts
- apps/api/src/test/mb1-spec-contract.test.ts
- docs/MB1-SPEC-CONTRACT.md
- apps/api/src/app.ts
- apps/api/src/controllers/mb1Controller.ts
- apps/api/src/openapi.ts
- apps/api/src/routes/mb1.ts
- apps/api/src/schemas/mb1.ts
- apps/api/src/test/mb1-spec-contract.test.ts
- docs/MB1-SPEC-CONTRACT.md
- .llm/plans/active/mb1-rss-rollout/02-DATA-MODEL-AND-MIGRATIONS.md
- .llm/plans/active/mb1-rss-rollout/11-TESTS-AND-DOCS-CHECKLIST.md
- .llm/plans/active/mb1-rss-rollout/12-TEST-FILE-MAPPING-AND-MATRIX.md
- .llm/plans/active/mb1-rss-rollout/13-WEB-PUBLIC-HOW-TO-PAGES.md

### Session 4 - 2026-04-13

#### Prompt (Developer)

the openapi spec for mb1 should be separate from the openapi spec for metaboost specific endpoints.

also the mb1 specific endpoints should use a declaration prefix. our implementation should account
for the possibility that many different standards will be supported one day

instead of

https://metaboost.cc/boost/<bucketId>

we should use

https://api.metaboost.cc/v1/s/mb1/boost/<bucketId>

/api/v1/ is specific to metaboost

/s/mb1/ is a declaration that this endpoint uses the mb1 standard

update files and plans as needed

#### Key Decisions

- Separate MB1 OpenAPI into a dedicated spec file and dedicated API docs/json endpoints.
- Move MB1 contract endpoints under declaration prefix `/s/mb1`.
- Update plan/docs and contract tests to match prefixed MB1 route design.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-01.md
- .llm/plans/active/mb1-rss-rollout/00-EXECUTION-ORDER.md
- .llm/plans/active/mb1-rss-rollout/00-SUMMARY.md
- .llm/plans/active/mb1-rss-rollout/08-WEB-BUCKET-CREATION-AND-RSS-TABS.md
- .llm/plans/active/mb1-rss-rollout/09-WEB-RSS-VERIFICATION-AND-MESSAGE-FILTERING.md
- .llm/plans/active/mb1-rss-rollout/11-TESTS-AND-DOCS-CHECKLIST.md
- .llm/plans/active/mb1-rss-rollout/12-TEST-FILE-MAPPING-AND-MATRIX.md
- .llm/plans/active/mb1-rss-rollout/13-WEB-PUBLIC-HOW-TO-PAGES.md
- .llm/plans/active/mb1-rss-rollout/COPY-PASTA.md

### Session 3 - 2026-04-13

#### Prompt (Developer)

Implement plan file .llm/plans/active/mb1-rss-rollout/01-MB1-SPEC-CONTRACT.md exactly as written.
Do not edit other plan files.

#### Key Decisions

- Implement MB1 contract endpoints, request validation, and OpenAPI contract in API layer.
- Add a focused API integration test file for MB1 contract endpoints.
- Keep changes scoped to code/docs required by plan file 01 only.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-01.md
- .llm/plans/active/mb1-rss-rollout/00-EXECUTION-ORDER.md
- .llm/plans/active/mb1-rss-rollout/00-SUMMARY.md
- .llm/plans/active/mb1-rss-rollout/01-MB1-SPEC-CONTRACT.md
- .llm/plans/active/mb1-rss-rollout/02-DATA-MODEL-AND-MIGRATIONS.md
- .llm/plans/active/mb1-rss-rollout/03-MINIMAL-RSS-PARSER-PACKAGE.md
- .llm/plans/active/mb1-rss-rollout/04-API-BUCKET-CREATION-RSS-CHANNEL-GROUP.md
- .llm/plans/active/mb1-rss-rollout/05-API-RSS-VERIFY-AND-SYNC-ITEM-BUCKETS.md
- .llm/plans/active/mb1-rss-rollout/06-API-BOOST-MB1-INGEST-AND-CONFIRM.md
- .llm/plans/active/mb1-rss-rollout/07-API-PUBLIC-MESSAGES-ENDPOINTS.md
- .llm/plans/active/mb1-rss-rollout/08-WEB-BUCKET-CREATION-AND-RSS-TABS.md
- .llm/plans/active/mb1-rss-rollout/09-WEB-RSS-VERIFICATION-AND-MESSAGE-FILTERING.md
- .llm/plans/active/mb1-rss-rollout/10-PODVERSE-PUBLIC-RSS-ASSET.md
- .llm/plans/active/mb1-rss-rollout/11-TESTS-AND-DOCS-CHECKLIST.md
- .llm/plans/active/mb1-rss-rollout/COPY-PASTA.md

### Session 2 - 2026-04-13

#### Prompt (Developer)

MB1 RSS Rollout - Tightened Plan

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as
in_progress as you work, starting with the first one. Don't stop until you have completed all
the to-dos.

#### Key Decisions

- Tighten the existing MB1 rollout plan set by adding explicit API test mapping and matrix coverage.
- Add a new public pages planning workstream for `/how-to/creators` and `/how-to/developers`.
- Keep changes scoped to plan/history files only.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-01.md
