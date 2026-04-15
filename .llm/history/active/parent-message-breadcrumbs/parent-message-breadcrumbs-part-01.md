### Session 1 - 2026-04-14

#### Prompt (Developer)

Parent Message Breadcrumbs + Remove Public Pages

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Extended authenticated bucket message responses to include per-message source bucket context (source bucket + parent bucket summary) so UI can render breadcrumb links without per-row lookups.
- Added mini-breadcrumb rendering support to shared message list/card components via optional `miniBreadcrumbItems`.
- Implemented parent-view breadcrumb rules on private bucket messages:
  - network view: channel > item (when item exists), or channel only
  - channel view: item-only breadcrumb when source is rss-item; no breadcrumb for channel self-messages
- Removed in-app public-page concept by deleting public tab references and hard-disabling `/b/:id` page to `notFound()`.
- Removed obsolete public route helper exports from web routes module and deleted unused public breadcrumb component file.
- Updated API and web E2E tests to cover source context payload and hard-disabled legacy `/b/*` behavior.
- Ran lint across touched workspaces (`helpers-requests`, `orm`, `ui`, `api`, `web`) successfully.

#### Files Modified

- apps/api/src/controllers/bucketMessagesController.ts
- apps/api/src/test/buckets.test.ts
- packages/orm/src/services/BucketService.ts
- packages/orm/src/entities/BucketMessage.ts
- packages/helpers-requests/src/types/bucket-types.ts
- packages/helpers-requests/src/types/index.ts
- packages/helpers-requests/src/index.ts
- packages/ui/src/components/bucket/BucketMessageList/BucketMessageList.tsx
- packages/ui/src/components/bucket/MessageCard/MessageCard.tsx
- packages/ui/src/components/bucket/MessageCard/MessageCard.module.scss
- apps/web/src/app/(main)/bucket/[id]/page.tsx
- apps/web/src/app/(main)/b/[id]/page.tsx
- apps/web/src/lib/routes.ts
- apps/web/e2e/short-bucket-bucket-owner.spec.ts
- apps/web/e2e/short-bucket-bucket-admin.spec.ts
- apps/web/e2e/short-bucket-non-admin.spec.ts
- apps/web/e2e/short-bucket-unauthenticated.spec.ts
- apps/web/e2e/bucket-rss-messages-non-admin.spec.ts
- apps/web/src/app/(main)/b/[id]/PublicBucketBreadcrumbs.tsx (deleted)
- .llm/history/active/parent-message-breadcrumbs/parent-message-breadcrumbs-part-01.md
