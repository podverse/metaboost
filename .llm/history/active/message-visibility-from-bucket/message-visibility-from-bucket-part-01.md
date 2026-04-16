### Session 1 - 2026-04-16

#### Prompt (Developer)

Message visibility driven by bucket (not submitter)

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Ingest sets visibility from the target bucket; mbrss-v1 contract tests cover private-channel behavior.

#### Files Modified

- apps/api/src/controllers/mbrssV1Controller.ts
- packages/orm/src/services/BucketMessageService.ts
- apps/api/src/test/mbrss-v1-spec-contract.test.ts

### Session 2 - 2026-04-16

#### Prompt (Developer)

@metaboost/packages/orm/src/services/BucketMessageService.ts:187 the isPublic setting on messages needs to be removed entirely, from the schema, and also since every message will take on the public settings of the bucket it is in, we do not need to have the indicator in message components which tells you if messages are public or not

#### Key Decisions

- Message visibility is determined by the bucket only; API and types omit a message-level public field.
- `publicOnly` queries join the bucket and filter `bucket.is_public`.
- Removed public/private indicators from message list UI components.

#### Files Modified

- infra/k8s/base/db/postgres-init/0003_app_schema.sql
- packages/orm/src/entities/BucketMessage.ts
- packages/orm/src/services/BucketMessageService.ts
- apps/api/src/lib/bucket-policy.ts
- apps/api/src/controllers/bucketMessagesController.ts
- apps/api/src/controllers/mbrssV1Controller.ts
- apps/management-api/src/lib/messageToJson.ts
- apps/management-api/src/openapi.ts
- packages/helpers-requests/src/types/bucket-types.ts
- packages/helpers-requests/src/management-web/bucketMessages.ts
- packages/ui (MessageCard, BucketMessageList, styles)
- apps/web and apps/management-web bucket detail pages
- apps/management-web/src/components/buckets/BucketMessagesClient.tsx
- tools/generate-data/src/main/seed.ts
- apps/api/src/test/mbrss-v1-spec-contract.test.ts
- apps/api/src/test/buckets.test.ts
- apps/management-api/src/test/management-buckets-messages.test.ts
- apps/management-web/e2e/helpers/advancedFixtures.ts
- apps/api/src/lib/BUCKET-POLICY.md

### Session 3 - 2026-04-16

#### Prompt (Developer)

@metaboost/apps/web/src/app/(main)/bucket/[id]/page.tsx:267 i see message.sendId but we want to get rid of references to sender id in metaboost instead it should be senderGuid etc

#### Key Decisions

- Renamed hydrated/API-facing `senderId` to `senderGuid` across ORM entities, services, OpenAPI public message schema, helpers-requests types, web UI, seed data, and i18n (`messageMeta.senderGuid`); DB column remains `sender_id` via `@Column({ name: 'sender_id', ... })`.

#### Files Modified

- packages/orm/src/entities/BucketMessage.ts
- packages/orm/src/entities/BucketMessageAppMeta.ts
- packages/orm/src/services/BucketMessageService.ts
- apps/api/src/controllers/mbrssV1Controller.ts
- apps/api/src/openapi-mbrssV1.ts
- packages/helpers-requests/src/types/bucket-types.ts
- apps/web/src/app/(main)/bucket/[id]/page.tsx
- tools/generate-data/src/main/seed.ts
- apps/web/i18n/originals/en-US.json
- apps/web/i18n/originals/es.json
- apps/web/i18n/overrides/es.json
- apps/management-web/i18n/originals/en-US.json
- apps/management-web/i18n/originals/es.json
- apps/management-web/i18n/overrides/es.json
