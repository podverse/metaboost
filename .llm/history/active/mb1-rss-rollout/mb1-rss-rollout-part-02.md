### Session 11 - 2026-04-13

#### Prompt (Developer)

@metaboost/apps/web/src/app/(main)/how-to/creators/page.tsx:1-53 this should use i18n

#### Key Decisions

- Convert the creators how-to page to use server-side `next-intl` translations.
- Add a dedicated `howToCreators` translation namespace in `en-US` and `es` originals.
- Keep route/link behavior unchanged while localizing all page copy.
- Add a scoped public how-to E2E spec to keep coverage aligned with unauthenticated page behavior.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-02.md
- apps/web/src/app/(main)/how-to/creators/page.tsx
- apps/web/i18n/originals/en-US.json
- apps/web/i18n/originals/es.json
- apps/web/e2e/how-to-pages-public.spec.ts

### Session 12 - 2026-04-13

#### Prompt (Developer)

@metaboost/apps/api/src/config/index.ts:98-99 this should not be a "mb1" specific terms of service
url. it should be a "messagesTermsOfServiceUrl"

#### Key Decisions

- Rename the API config key to `messagesTermsOfServiceUrl` so the concept is not MB1-specific.
- Rename the env variable to `API_MESSAGES_TERMS_OF_SERVICE_URL` across runtime config, startup validation, test setup, and env classification/docs.
- Keep MB1 capability response field name unchanged (`terms_of_service_url`) while sourcing it from the generic config key.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-02.md
- apps/api/src/config/index.ts
- apps/api/src/controllers/mb1Controller.ts
- apps/api/src/lib/startup/validation.ts
- apps/api/src/test/setup.ts
- apps/api/src/test/mb1-spec-contract.test.ts
- apps/api/.env
- infra/env/classification/base.yaml
- infra/env/overrides/remote-k8s.yaml
- docs/MB1-SPEC-CONTRACT.md
- docs/development/ENV-REFERENCE.md

### Session 13 - 2026-04-13

#### Prompt (Developer)

For the code present, we get this error:
```
Type '`API ${string}`' is not assignable to type '\"API v1\"'.
```
Fix it, verify, and then give a concise explanation. @metaboost/apps/api/src/lib/api-docs.ts:17-20

#### Key Decisions

- Widen `ApiDocsBundle` `servers` typing so runtime-configured server descriptions (`API ${config.apiVersionPath}`) are valid.
- Keep OpenAPI document structure unchanged; only relax overly narrow literal typing caused by `as const`.
- Verify with focused API TypeScript type-check.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-02.md
- apps/api/src/lib/api-docs.ts

### Session 14 - 2026-04-13

#### Prompt (Developer)

@metaboost/apps/web/src/app/(main)/how-to/developers/page.tsx:1-53 this should use i18n

#### Key Decisions

- Convert the developers how-to page to server-side `next-intl` translations.
- Add a dedicated `howToDevelopers` translation namespace in `en-US` and `es` originals.
- Keep existing route/link behavior unchanged while localizing all page copy.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-02.md
- apps/web/src/app/(main)/how-to/developers/page.tsx
- apps/web/i18n/originals/en-US.json
- apps/web/i18n/originals/es.json

### Session 15 - 2026-04-13

#### Prompt (Developer)

review @metaboost/.llm/plans/active/mb1-rss-rollout/01-MB1-SPEC-CONTRACT.md if it is complete, move
it to completed, else complete it

#### Key Decisions

- `01-MB1-SPEC-CONTRACT` was not complete, so implement missing contract behavior before moving file.
- Add RSS channel/item metadata persistence (`bucket_rss_channel_info`, `bucket_rss_item_info`) so
  MB1 ingest can validate `feed_guid` and resolve `item_guid` routing.
- Extend `bucket_message` persistence with MB1 metadata and `payment_verified_by_app`, and enforce
  verified-only public MB1 message listing with channel/item scoped resolution.
- After implementing and verifying type-check, move
  `01-MB1-SPEC-CONTRACT.md` from active to completed.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-02.md
- packages/orm/src/entities/BucketMessage.ts
- packages/orm/src/entities/BucketRSSChannelInfo.ts
- packages/orm/src/entities/BucketRSSItemInfo.ts
- packages/orm/src/data-source.ts
- packages/orm/src/services/BucketMessageService.ts
- packages/orm/src/services/BucketRSSChannelInfoService.ts
- packages/orm/src/services/BucketRSSItemInfoService.ts
- packages/orm/src/index.ts
- apps/api/src/controllers/mb1Controller.ts
- apps/api/src/controllers/bucketMessagesController.ts
- apps/management-api/src/controllers/bucketMessagesController.ts
- apps/api/src/test/mb1-spec-contract.test.ts
- infra/k8s/base/stack/postgres-init/0003_app_schema.sql
- .llm/plans/active/mb1-rss-rollout/01-MB1-SPEC-CONTRACT.md
- .llm/plans/completed/mb1-rss-rollout/01-MB1-SPEC-CONTRACT.md

### Session 16 - 2026-04-13

#### Prompt (Developer)

add additional fields to the mb1 boost message endpoint

podcast_index_feed_id = optional, number (corresponds with the id of the feed within Podcast Index)
time_position = optional, number (corresponds with the numeric value in seconds within a media item when the boost is sent)
action = required, boost or stream are the only 2 options accepted. if "stream" then NO message should be sent. if boost, then message is optional.
app_version = optional, string value (likely a semver) of the app sending the boost message request

they should be ordered in the mb1 spec logically

update plan files as needed and update any files that should have had this handled within the now completed @metaboost/.llm/plans/completed/mb1-rss-rollout/01-MB1-SPEC-CONTRACT.md

#### Key Decisions

- Add MB1 ingest fields `podcast_index_feed_id`, `time_position`, required `action`, and optional `app_version` to schema, OpenAPI, docs, tests, and completed plan contract.
- Enforce `action` as `boost | stream`; when `action='stream'`, return success without creating a message row.
- Persist new MB1 metadata fields on `bucket_message` rows for boost actions.
- Keep MB1 request body field order aligned across spec docs and OpenAPI for readability and implementation consistency.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-02.md
- apps/api/src/schemas/mb1.ts
- apps/api/src/controllers/mb1Controller.ts
- apps/api/src/controllers/bucketMessagesController.ts
- apps/api/src/openapi-mb1.ts
- apps/api/src/test/mb1-spec-contract.test.ts
- apps/management-api/src/controllers/bucketMessagesController.ts
- packages/orm/src/entities/BucketMessage.ts
- packages/orm/src/services/BucketMessageService.ts
- infra/k8s/base/stack/postgres-init/0003_app_schema.sql
- docs/MB1-SPEC-CONTRACT.md
- .llm/plans/completed/mb1-rss-rollout/01-MB1-SPEC-CONTRACT.md

### Session 17 - 2026-04-13

#### Prompt (Developer)

Remove Non-MB1 Message Writes

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Remove all non-MB1 message create/update endpoints from main API and management API with no backward-compatibility routes.
- Keep message delete endpoints and existing delete authorization behavior intact across main and management surfaces.
- Hard-remove main web and management-web message submit/edit pages and edit/add affordances; leave message listing and delete actions.
- Remove obsolete request-helper DTO/functions and route helpers tied to removed message write flows.
- Replace write-path API/E2E coverage with route-removal assertions and delete/read-only UI expectations.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-02.md
- apps/api/src/routes/buckets.ts
- apps/api/src/controllers/bucketMessagesController.ts
- apps/api/src/schemas/buckets.ts
- apps/api/src/test/buckets.test.ts
- apps/management-api/src/routes/buckets.ts
- apps/management-api/src/controllers/bucketMessagesController.ts
- apps/management-api/src/openapi.ts
- apps/management-api/src/test/management-buckets-messages.test.ts
- apps/management-api/src/schemas/messages.ts
- apps/web/src/app/(main)/b/[id]/page.tsx
- apps/web/src/app/(main)/b/[id]/send-message/page.tsx
- apps/web/src/app/(main)/b/PublicSubmitForm.tsx
- apps/web/src/app/(main)/b/PublicSubmitForm.module.scss
- apps/web/src/app/(main)/bucket/[id]/messages/[messageId]/edit/page.tsx
- apps/web/src/app/(main)/bucket/[id]/EditMessageForm.tsx
- apps/web/src/app/(main)/bucket/[id]/EditMessageForm.module.scss
- apps/web/src/app/(main)/bucket/[id]/BucketMessagesPanel.tsx
- apps/web/src/app/(main)/bucket/[id]/messages/BucketMessagesPageClient.tsx
- apps/web/src/lib/routes.ts
- apps/web/e2e/short-bucket-unauthenticated.spec.ts
- apps/web/e2e/send-message-unauthenticated.spec.ts
- apps/web/e2e/send-message-non-admin.spec.ts
- apps/web/e2e/send-message-bucket-owner.spec.ts
- apps/web/e2e/send-message-bucket-admin.spec.ts
- apps/web/e2e/bucket-message-edit-unauthenticated.spec.ts
- apps/web/e2e/bucket-message-edit-non-admin.spec.ts
- apps/web/e2e/bucket-message-edit-bucket-owner.spec.ts
- apps/web/e2e/bucket-message-edit-bucket-admin.spec.ts
- apps/web/e2e/bucket-message-edit-admin-without-permission.spec.ts
- apps/management-web/src/app/(main)/bucket/[id]/messages/BucketMessagesPageClient.tsx
- apps/management-web/src/app/(main)/bucket/[id]/BucketMessagesPanel.tsx
- apps/management-web/src/components/buckets/BucketMessagesClient.tsx
- apps/management-web/src/components/buckets/BucketMessageEditClient.tsx
- apps/management-web/src/app/(main)/bucket/[id]/messages/[messageId]/edit/page.tsx
- apps/management-web/src/lib/routes.ts
- apps/management-web/e2e/bucket-messages-super-admin-full-crud.spec.ts
- apps/management-web/e2e/bucket-message-edit-unauthenticated.spec.ts
- apps/management-web/e2e/bucket-message-edit-super-admin-full-crud.spec.ts
- apps/management-web/e2e/bucket-message-edit-limited-admin-no-buckets-read.spec.ts
- apps/management-web/e2e/bucket-message-edit-admin-with-buckets-read-no-message-update.spec.ts
- packages/ui/src/components/bucket/BucketMessageList/BucketMessageList.tsx
- packages/ui/src/components/bucket/BucketMessagesPageContent/BucketMessagesPageContent.tsx
- packages/helpers-requests/src/index.ts
- packages/helpers-requests/src/types/index.ts
- packages/helpers-requests/src/types/bucket-types.ts
- packages/helpers-requests/src/web/buckets.ts
- packages/helpers-requests/src/management-web/bucketMessages.ts
- makefiles/local/e2e-spec-order-web.txt
- makefiles/local/e2e-spec-order-management-web.txt
- docs/testing/E2E-SPEC-REPORT-COMMANDS.md
- docs/testing/E2E-CRUD-STATE-AUTH-MATRIX-WEB.md

### Session 18 - 2026-04-13

#### Prompt (Developer)

Hide Stream Messages From Current Message APIs/UI

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Keep storing `action='stream'` rows, but hide them from all current message retrieval APIs by filtering retrieval to `action='boost'`.
- Apply boost-only filtering at ORM service retrieval/count level so all current controllers can consistently exclude stream rows.
- Preserve current delete paths and endpoint shapes; only list/get visibility changes for current message APIs.
- Update MB1 and management OpenAPI wording plus MB1 contract docs to clarify stream rows are excluded from current message endpoints.
- Add integration tests in main API, management API, and MB1 contract coverage to assert stream rows are excluded from current retrieval endpoints.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-02.md
- packages/orm/src/services/BucketMessageService.ts
- apps/api/src/controllers/bucketMessagesController.ts
- apps/api/src/controllers/mb1Controller.ts
- apps/management-api/src/controllers/bucketMessagesController.ts
- apps/management-api/src/openapi.ts
- apps/api/src/openapi-mb1.ts
- docs/MB1-SPEC-CONTRACT.md
- apps/api/src/test/buckets.test.ts
- apps/management-api/src/test/management-buckets-messages.test.ts
- apps/api/src/test/mb1-spec-contract.test.ts

### Session 19 - 2026-04-13

#### Prompt (Developer)

@metaboost/apps/api/src/schemas/mb1.ts:9 this should be part of a helpers constant somehow and used

#### Key Decisions

- Add shared MB1 action constants and union type in `@metaboost/helpers` so API schema validation does not hardcode literal action strings.
- Validate `action` in MB1 Joi schema using `MB1_ACTION_VALUES` and derive the request-body action type from the same constant.
- Rebuild `@metaboost/helpers` and run `@metaboost/api` type-check to verify downstream usage compiles cleanly.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-02.md
- packages/helpers/src/mb1/constants.ts
- packages/helpers/src/index.ts
- apps/api/src/schemas/mb1.ts

### Session 20 - 2026-04-13

#### Prompt (Developer)

For the code present, we get this error:
```
Forbidden non-null assertion.
```
Fix it, verify, and then give a concise explanation. @metaboost/apps/api/src/test/buckets.test.ts:233-236 

this lint rule should not be applied within test files specifically

#### Key Decisions

- Remove the immediate non-null assertion in `buckets.test.ts` by adding an explicit null guard before using `bucket.id`.
- Add an ESLint test-files override so `@typescript-eslint/no-non-null-assertion` is disabled for test/spec files only.
- Verify with IDE lint diagnostics on the modified files and the API test directory.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-02.md
- apps/api/src/test/buckets.test.ts
- eslint.config.mjs
