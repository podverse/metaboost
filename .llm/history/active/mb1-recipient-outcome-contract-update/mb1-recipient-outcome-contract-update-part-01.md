### Session 1 - 2026-04-14

#### Prompt (Developer)

MB1 Recipient Outcome Contract Update

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Replaced boolean-first legacy follow-up route (removed) contract with strict recipient outcome arrays.
- Enforced server-side field whitelisting for recipient outcomes and status enum validation.
- Added persisted verification level plus recipient-outcome JSON and summary counters.
- Derived four verification levels from largest-recipient split + recipient statuses.
- Changed default message filtering threshold to `verified-largest-recipient-succeeded`.
- Added include flags for partially verified and unverified result expansion.
- Kept `payment_verified_by_app` in responses as a backward-compatible derived field.

#### Files Modified

- .llm/history/active/mb1-recipient-outcome-contract-update/mb1-recipient-outcome-contract-update-part-01.md
- apps/api/src/controllers/bucketMessagesController.ts
- apps/api/src/controllers/mb1Controller.ts
- apps/api/src/openapi-mb1.ts
- apps/api/src/schemas/mb1.ts
- apps/api/src/test/mb1-spec-contract.test.ts
- apps/management-api/src/controllers/bucketMessagesController.ts
- apps/management-api/src/lib/messageToJson.ts
- apps/web/src/app/(main)/bucket/[id]/page.tsx
- apps/web/src/lib/buckets.ts
- docs/MB1-SPEC-CONTRACT.md
- infra/k8s/base/db/postgres-init/0003_app_schema.sql
- packages/helpers-requests/src/types/bucket-types.ts
- packages/helpers-requests/src/web/buckets.ts
- packages/orm/src/entities/BucketMessage.ts
- packages/orm/src/index.ts
- packages/orm/src/services/BucketMessageService.ts

### Session 2 - 2026-04-16

#### Prompt (Developer)

MB1 Single-Send Contract (No Confirm/Verification)

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Removed MB1 legacy follow-up route (removed) endpoint and request/response contract entirely from API routes,
  schema validation, controller logic, and MB1 OpenAPI.
- Eliminated verification persistence model by removing payment verification and recipient outcome
  entities/tables, plus service hydration/filtering that depended on them.
- Simplified message listing to stop using verification thresholds and include flags in API,
  management-api, helpers request clients, and web/management-web query handling.
- Removed verification UI affordances (status badges, details sections, filter toggles) and deleted
  related i18n keys from web and management-web locale files.
- Rewrote MB1 contract and integration/E2E tests for the new single-send lifecycle and no-update
  semantics.

#### Files Modified

- .llm/history/active/mb1-recipient-outcome-contract-update/mb1-recipient-outcome-contract-update-part-01.md
- apps/api/src/controllers/bucketMessagesController.ts
- apps/api/src/controllers/mb1Controller.ts
- apps/api/src/openapi-mb1.ts
- apps/api/src/routes/mb1.ts
- apps/api/src/schemas/mb1.ts
- apps/api/src/test/mb1-spec-contract.test.ts
- apps/management-api/src/controllers/bucketMessagesController.ts
- apps/management-api/src/lib/messageToJson.ts
- apps/management-web/i18n/originals/en-US.json
- apps/management-web/i18n/originals/es.json
- apps/management-web/i18n/overrides/es.json
- apps/management-web/src/app/(main)/bucket/[id]/MessagesHeaderControls.tsx
- apps/management-web/src/app/(main)/bucket/[id]/page.tsx
- apps/web/e2e/bucket-rss-messages-unverified-toggle-bucket-admin.spec.ts
- apps/web/e2e/bucket-rss-messages-unverified-toggle-bucket-owner.spec.ts
- apps/web/i18n/originals/en-US.json
- apps/web/i18n/originals/es.json
- apps/web/i18n/overrides/es.json
- apps/web/src/app/(main)/bucket/[id]/MessagesHeaderControls.tsx
- apps/web/src/app/(main)/bucket/[id]/page.tsx
- apps/web/src/lib/buckets.ts
- docs/MB1-SPEC-CONTRACT.md
- infra/k8s/base/db/postgres-init/0003_app_schema.sql
- packages/helpers-requests/src/management-web/bucketMessages.ts
- packages/helpers-requests/src/types/bucket-types.ts
- packages/helpers-requests/src/web/buckets.ts
- packages/orm/src/data-source.ts
- packages/orm/src/entities/BucketMessage.ts
- packages/orm/src/entities/BucketMessagePaymentVerification.ts (deleted)
- packages/orm/src/entities/BucketMessageRecipientOutcome.ts (deleted)
- packages/orm/src/index.ts
- packages/orm/src/services/BucketMessageService.ts
- tools/generate-data/src/contracts.ts
- tools/generate-data/src/main/data-source.ts
- tools/generate-data/src/main/seed.ts
