### Session 1 - 2026-04-18

#### Prompt (Developer)

List sort/filter: API fetch + overlay (no `router.refresh`) — implement the plan; do not edit the plan file; complete all todos.

#### Key Decisions

- Dashboard: `GET /buckets` with merged cookie/URL query; `BucketsTableWithFilter` client snapshot + `fetchDashboardBucketsTableSnapshot`.
- Child lists: `BucketService.findChildren` options (search, sort); `listChildBuckets` in apps/api and management-api; in-memory order for `lastMessage` after enrichment.
- `BucketDetailContent` takes `onBucketsSortMetadataChange`; web and management use `WebBucketDetailContent` / `ManagementBucketDetailContent` for client refetch.
- Documented sort-prefs skill: no `router.refresh` for sort/filter list updates; tab nav may still refresh until migrated.

#### Files Modified

- `apps/web/src/lib/dashboardBucketsApiQuery.ts`, `apps/web/src/lib/bucketTypeLabel.ts`, `apps/web/src/lib/client/dashboardBucketsListClient.ts`, `apps/web/src/lib/client/childBucketsListClient.ts`, `apps/web/src/components/BucketsTableWithFilter.tsx`, `apps/web/src/components/WebBucketDetailContent.tsx`, `apps/web/src/app/(main)/dashboard/page.tsx`, `apps/web/src/app/(main)/bucket/[id]/page.tsx`
- `apps/management-web/src/lib/client/managementChildBucketsListClient.ts`, `apps/management-web/src/components/ManagementBucketDetailContent.tsx`, `apps/management-web/src/app/(main)/bucket/[id]/page.tsx`
- `packages/helpers-requests/src/web/buckets.ts`, `packages/helpers-requests/src/management-web/buckets.ts`, `packages/helpers-requests/src/index.ts`
- `packages/orm/src/services/BucketService.ts`, `apps/api/src/controllers/bucketsController.ts`, `apps/management-api/src/controllers/bucketsController.ts`, `apps/api/src/test/buckets.test.ts`
- `packages/ui/src/components/bucket/BucketDetailContent/BucketDetailContent.tsx`, `.cursor/skills/sort-prefs-cookie-by-path/SKILL.md`
