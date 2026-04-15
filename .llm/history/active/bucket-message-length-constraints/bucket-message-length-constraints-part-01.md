### Session 1 - 2026-04-14

#### Prompt (Developer)

change the max to 2500, then implement

#### Key Decisions

- Use min `140`, max `2500`, and default `500` for bucket message body max length.
- Keep `messageBodyMaxLength` non-null in green-field schema (`NOT NULL DEFAULT 500` plus DB check constraint `140..2500`).
- Remove API-level `null` acceptance and blank/no-limit UI semantics; require integer input in range `140..2500`.
- Preserve existing behavior of optional field omission on PATCH while rejecting explicit `null`.
- Use local constants (`140`/`2500`) in API/UI/ORM service codepaths for compile stability.

#### Files Modified

- apps/api/src/controllers/bucketMessagesController.ts
- apps/api/src/lib/bucket-response.ts
- apps/api/src/schemas/buckets.ts
- apps/api/src/test/buckets.test.ts
- apps/management-api/src/lib/bucketToJson.ts
- apps/management-api/src/openapi.ts
- apps/management-api/src/schemas/buckets.ts
- apps/management-api/src/test/management-buckets-messages.test.ts
- apps/management-web/i18n/originals/en-US.json
- apps/management-web/i18n/originals/es.json
- apps/management-web/src/app/(main)/bucket/[id]/settings/page.tsx
- apps/management-web/src/components/buckets/BucketForm.tsx
- apps/web/i18n/originals/en-US.json
- apps/web/i18n/originals/es.json
- apps/web/src/app/(main)/bucket/[id]/settings/page.tsx
- apps/web/src/app/(main)/buckets/BucketForm.tsx
- docs/buckets/WEB-BUCKET-ADMIN-ROLE-INHERITANCE.md
- infra/k8s/base/db/postgres-init/0003_app_schema.sql
- packages/helpers/src/db/field-lengths.ts
- packages/helpers/src/db/index.ts
- packages/helpers/src/index.ts
- packages/helpers-requests/src/management-web/buckets.ts
- packages/helpers-requests/src/types/bucket-types.ts
- packages/helpers-requests/src/web/buckets.ts
- packages/orm/src/entities/BucketSettings.ts
- packages/orm/src/services/BucketService.ts
- .llm/history/active/bucket-message-length-constraints/bucket-message-length-constraints-part-01.md
