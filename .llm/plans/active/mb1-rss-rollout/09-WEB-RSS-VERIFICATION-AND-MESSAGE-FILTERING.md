# 09 - Web RSS Verification and Message Filtering

## Scope

Add RSS verification UI and private-message filtering for unverified messages.

## Add to RSS Tab UX

Render instructional text explaining:

- paste canonical tag under RSS `<channel>`
- expected tag:

```xml
<podcast:metaBoost standard="mb1">https://metaboost.cc/boost/<bucketShortId>/</podcast:metaBoost>
```

UI elements:

- copyable snippet/code block
- `Verify Metaboost Enabled` button
- verification status section:
  - `Not Verified` (default and latest failure)
  - `Last Verified Successfully: <date>` (latest success)

## Verify Action

- Trigger API verification endpoint from Plan 05.
- Show in-button loading state while request is active.
- Render success/failure feedback with clear server message.

## Message Visibility Filter

Private bucket messages page only:

- show checkbox: `Show unverified messages`
- default unchecked
- visible only for owner/admin users
- when checked, request includes explicit include-unverified flag

Public message pages:

- always verified-only
- no unverified filter control

## RSS Channel Buckets Table

In RSS Channel buckets tab:

- show RSS item buckets sorted by `rss_item_pub_date` descending
- add visible pub date column
- include orphaned warning affordance for orphaned items (yellow warning icon + explanation)

## Files Likely Touched

- `apps/web/src/app/(main)/bucket/[id]/*`
- bucket panel components under `packages/ui/src/components/bucket/*`
- i18n keys for new labels/messages
- request helper contracts for include-unverified and verify endpoint calls

## E2E Coverage

- Add to RSS tab renders expected snippet and verify button
- verify success updates status with timestamp
- verify failure displays actionable error
- owner/admin can toggle show-unverified and see additional messages
- non-owner/non-admin does not see toggle
- RSS item list order by pub date and orphan warning visibility

Required spec mapping is defined in:

- `12-TEST-FILE-MAPPING-AND-MATRIX.md`
- primary specs:
  - `apps/web/e2e/bucket-rss-add-tab-bucket-owner.spec.ts`
  - `apps/web/e2e/bucket-rss-verify-status-bucket-owner.spec.ts`
  - `apps/web/e2e/bucket-rss-messages-unverified-toggle-bucket-owner.spec.ts`
  - `apps/web/e2e/bucket-rss-messages-unverified-toggle-bucket-admin.spec.ts`
  - `apps/web/e2e/bucket-rss-messages-non-admin.spec.ts`
  - `apps/web/e2e/bucket-rss-url-state-contract.spec.ts`
