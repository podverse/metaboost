# 08 - Web Bucket Creation and RSS Tabs

## Scope

Implement web UX for selecting bucket type and showing RSS-specific tab behavior.

## Hard-Replacement Rule

- Do not keep deprecated create-flow UI paths as hidden fallback routes.
- Replaced/removed UI entry points should be hard-removed (not redirected to compatibility screens).

## Create Bucket UX Changes

Update create flow to present:

- `RSS Channel`
- `Group`

Descriptions:

- RSS Channel: connect Metaboost to RSS podcast/music/livestream.
- Group: combine multiple RSS channels under one bucket.

Form behavior:

- Group selected: show name input, require non-empty value.
- RSS Channel selected: show RSS URL input, no manual name field.

Context-sensitive child creation:

- top-level: allow Group and RSS Channel
- inside Group: allow RSS Channel only
- inside RSS Channel and RSS Item: hide/disable create button and route access

## Bucket Detail Tabs

For `rss-channel` bucket:

- Add `Add to RSS` tab.
- On first post-create redirect, land on `Add to RSS` tab.
- Keep Messages and Buckets tabs as applicable.

For `group` bucket:

- Do not show `Add to RSS` tab.

For `rss-item` bucket:

- No create-child affordances.
- Show relevant tabs only.

## Routing and URL State

- Extend route helpers for tab link generation.
- Use existing tab query pattern unless path-segment tabs are preferred in current app.
- Preserve canonical URLs and avoid default-param noise.

## API Integration

- Use helpers-requests patterns for all calls.
- Submit `type` and type-specific payload expected by updated API.

## Files Likely Touched

- `apps/web/src/app/(main)/buckets/new/*`
- `apps/web/src/app/(main)/bucket/[id]/page.tsx`
- `apps/web/src/app/(main)/bucket/[id]/BucketDetailTabsClient.tsx`
- `apps/web/src/lib/routes.ts`
- request helpers and DTOs in shared request package if needed

## E2E Coverage

- create top-level group
- create top-level rss-channel
- create rss-channel under group
- ensure create button absent inside rss-channel and rss-item pages
- ensure first redirect lands on Add to RSS tab for rss-channel

Required spec mapping is defined in:

- `12-TEST-FILE-MAPPING-AND-MATRIX.md`
- primary spec: `apps/web/e2e/bucket-create-rss-channel-bucket-owner.spec.ts`
