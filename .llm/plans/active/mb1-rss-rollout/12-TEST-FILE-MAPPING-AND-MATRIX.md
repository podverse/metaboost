# 12 - Test File Mapping and Matrix

## Scope

Turn MB1 test requirements into concrete, implementation-ready file mapping with scenario matrix
coverage for API integration and browser E2E tests.

## API Integration Tests - Exact File Mapping

### Extend Existing

- `apps/api/src/test/buckets.test.ts`
  - add typed create cases (`group`, `rss-channel`)
  - add child-type restriction coverage tied to parent bucket type
- `apps/api/src/test/global-setup.mjs`
  - include new RSS-related tables in truncate/cleanup logic

### Add New

- `apps/api/src/test/buckets-rss-channel.test.ts`
  - rss-channel creation from feed URL
  - missing required feed fields and parser-driven validation failures
- `apps/api/src/test/bucket-rss-verify-sync.test.ts`
  - verify endpoint behavior, parse timestamps/hash updates
  - item sync create/update/orphan/un-orphan behavior
  - reparse-on-miss and parse-throttle checks
- `apps/api/src/test/mb1-boost-ingest.test.ts`
  - capability endpoint shape
  - ingest success for channel-level and item-level payloads
  - validation errors for required fields and field-pair dependencies
  - feed guid mismatch and item-guid-missing-after-reparse behavior
  - confirm-payment endpoint behavior
- `apps/api/src/test/messages-public.test.ts`
  - verified-only visibility
  - reverse chronological ordering
  - scoped channel/item retrieval routes
  - behavior when public messages are disabled

## Web E2E Tests - Exact File Mapping

### Add New Specs

- `apps/web/e2e/bucket-create-rss-channel-bucket-owner.spec.ts`
- `apps/web/e2e/bucket-rss-add-tab-bucket-owner.spec.ts`
- `apps/web/e2e/bucket-rss-verify-status-bucket-owner.spec.ts`
- `apps/web/e2e/bucket-rss-messages-unverified-toggle-bucket-owner.spec.ts`
- `apps/web/e2e/bucket-rss-messages-unverified-toggle-bucket-admin.spec.ts`
- `apps/web/e2e/bucket-rss-messages-non-admin.spec.ts`
- `apps/web/e2e/bucket-rss-url-state-contract.spec.ts`

### Optional Extend (if existing specs are a better fit)

- `apps/web/e2e/bucket-messages-bucket-owner.spec.ts`
- `apps/web/e2e/bucket-messages-bucket-admin.spec.ts`
- `apps/web/e2e/bucket-detail-bucket-owner.spec.ts`

If extended instead of new files, keep spec naming and report ordering conventions intact.

## Matrix Requirements

### Authz Matrix

API:

- owner/admin allowed for private unverified reads where designed
- non-admin/unauthorized denied for privileged behaviors
- public routes respect public toggle and never leak restricted data

Web:

- owner/admin can see and use unverified toggle
- non-admin cannot see privileged controls
- unauthenticated users follow intended public/private route behavior

### URL-State Matrix

- rss-channel create redirect lands on Add to RSS tab
- Add to RSS tab remains active on refresh/back navigation
- query params reflect user-selected state only (no default noise)
- URL-state contract spec verifies canonical tab/filter persistence

### Negative-Path Matrix

API:

- invalid body schema and missing field dependencies
- feed guid mismatch
- verify failure with missing/mismatched metaboost tag
- not found/forbidden paths for disabled or invalid public message requests

Web:

- verify action failure UI clearly visible
- invalid bucket/item routes show expected not-found/forbidden states
- non-admin attempts to force unverified filters do not reveal data

## Verification Ownership

- API test updates are required deliverables for plans `04` through `07`.
- Web E2E updates are required deliverables for plans `08`, `09`, and `13`.
