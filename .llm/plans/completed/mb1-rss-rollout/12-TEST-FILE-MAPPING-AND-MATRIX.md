# 12 - Test File Mapping and Matrix

## Scope

Turn MB1 test requirements into concrete, implementation-ready file mapping with scenario matrix
coverage for API integration and browser E2E tests.

## No-Compatibility Enforcement

- All matrix coverage assumes hard replacement (no backwards compatibility adapters).
- Removed API/UI surfaces must be asserted as removed (404/absent), not redirected or aliased.

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
  - ingest success with `action='boost'` and `action='stream'` contract semantics
  - optional `amount_unit` omitted -> persisted as `NULL`
  - BTC + sats payload round-trip behavior
  - validation errors for required fields and field-pair dependencies
  - feed guid mismatch and item-guid-missing-after-reparse behavior
  - legacy follow-up route (removed) endpoint behavior
- `apps/api/src/test/messages-public.test.ts`
  - verified-only visibility
  - boost-only visibility (`action='boost'`)
  - reverse chronological ordering
  - scoped channel/item retrieval routes
  - behavior when public messages are disabled
  - response includes MB1 metadata display fields

## Web E2E Tests - Exact File Mapping

### Add New Specs

- `apps/web/e2e/bucket-create-rss-channel-bucket-owner.spec.ts`
- `apps/web/e2e/bucket-rss-add-tab-bucket-owner.spec.ts`
- `apps/web/e2e/bucket-rss-verify-status-bucket-owner.spec.ts`
- `apps/web/e2e/bucket-rss-messages-unverified-toggle-bucket-owner.spec.ts`
- `apps/web/e2e/bucket-rss-messages-unverified-toggle-bucket-admin.spec.ts`
- `apps/web/e2e/bucket-rss-messages-non-admin.spec.ts`
- `apps/web/e2e/bucket-rss-url-state-contract.spec.ts`
- `apps/web/e2e/how-to-pages-public.spec.ts`

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
- optional `amount_unit` does not force rejection and remains null when omitted
- stream telemetry rows (`action='stream'`) do not appear in current message retrieval APIs
- removed legacy/non-MB1 routes remain 404 with no redirect/alias behavior

Web:

- owner/admin can see and use unverified toggle
- non-admin cannot see privileged controls
- unauthenticated users follow intended public/private route behavior
- MB1 metadata fields visible when present on both private and public message views
- stream telemetry rows are not shown in current message views
- deprecated UI entry points for replaced flows are absent (no fallback redirect paths)

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
- removed/old route paths return 404 and do not emit compatibility response shapes

Web:

- verify action failure UI clearly visible
- invalid bucket/item routes show expected not-found/forbidden states
- non-admin attempts to force unverified filters do not reveal data
- nullable `amount_unit` does not render implied unit labels
- BTC + sats rendering path displays satoshis as expected
- attempts to access removed UI paths do not redirect to compatibility pages

### i18n Matrix

Web:

- MB1 metadata labels and formatting text resolved from i18n keys
- how-to page MB1 field explanations are localized where applicable

## Verification Ownership

- API test updates are required deliverables for plans `04` through `07`.
- Web E2E updates are required deliverables for plans `08`, `09`, and `13`.
