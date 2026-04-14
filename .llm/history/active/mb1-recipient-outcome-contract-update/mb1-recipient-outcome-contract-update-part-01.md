### Session 1 - 2026-04-14

#### Prompt (Developer)

MB1 Recipient Outcome Contract Update

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Replaced boolean-first confirm-payment contract with strict recipient outcome arrays.
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
