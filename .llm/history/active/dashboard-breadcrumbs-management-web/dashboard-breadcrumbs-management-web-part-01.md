# dashboard-breadcrumbs-management-web

**Started:** 2026-05-06
**Author:** LLM session
**Context:** Dashboard-first breadcrumbs across management-web.

### Session 1 - 2026-05-06

#### Prompt (Developer)

in metaboost management, every page accessible via the dashboard should have a breadcrumb that brings you back to the Dashboard

#### Key Decisions

- Added `withDashboardBreadcrumb` + `ManagementBreadcrumbLink`; extended `FilterTablePageLayout` and bucket breadcrumb components with optional leading segments.
- List pages (admins, users, buckets, terms versions), events, global blocked apps, and existing form/detail pages now show Dashboard as the first crumb; bucket detail/settings include Dashboard via helper or `leadingItems`.

#### Files Created/Modified

- [apps/management-web/src/lib/management-breadcrumbs.ts](apps/management-web/src/lib/management-breadcrumbs.ts)
- [apps/management-web/src/components/ManagementBreadcrumbLink.tsx](apps/management-web/src/components/ManagementBreadcrumbLink.tsx)
- [packages/ui/src/components/layout/FilterTablePageLayout/FilterTablePageLayout.tsx](packages/ui/src/components/layout/FilterTablePageLayout/FilterTablePageLayout.tsx)
- [packages/ui/src/components/bucket/BucketSettingsBreadcrumbs/BucketSettingsBreadcrumbs.tsx](packages/ui/src/components/bucket/BucketSettingsBreadcrumbs/BucketSettingsBreadcrumbs.tsx)
- [packages/ui/src/components/bucket/BucketMessagesBreadcrumbs/BucketMessagesBreadcrumbs.tsx](packages/ui/src/components/bucket/BucketMessagesBreadcrumbs/BucketMessagesBreadcrumbs.tsx)
- [packages/ui/src/components/bucket/BucketMessagesPageContent/BucketMessagesPageContent.tsx](packages/ui/src/components/bucket/BucketMessagesPageContent/BucketMessagesPageContent.tsx)
- Multiple `apps/management-web/src/app/(main)/**` pages and [bucket settings layout/client](apps/management-web/src/app/(main)/bucket/[id]/settings/)
