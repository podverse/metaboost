# 11 - Tests and Docs Checklist

## Scope

Define required verification and documentation tasks for the mb1 rollout.

## No-Compatibility Enforcement

- Test strategy must treat this rollout as hard replacement (no backwards compatibility layer).
- Removed/replaced API or UI surfaces must not redirect or alias; they should be absent or return 404.

## Required Mapping Artifact

- `12-TEST-FILE-MAPPING-AND-MATRIX.md` is mandatory and must be completed before implementation is
  considered test-complete.

## API Integration Test Checklist

- Bucket create:
  - group create success
  - rss-channel create success from feed URL
  - child-type restrictions enforced
- RSS verify/sync:
  - verify success stores timestamps/hash
  - verify failure sets expected error state
  - item upsert/orphan/un-orphan behavior
- mb1 ingest:
  - capability endpoint response shape
  - ingest success for channel-level and item-level payloads
  - ingest action behavior:
    - `action='boost'` creates display-intended message flow
    - `action='stream'` follows stream telemetry flow and does not appear in current message retrieval
  - optional `amount_unit` accepted and stored as `NULL` when omitted
  - clear validation error messages for bad payloads
  - feed guid mismatch behavior
- payment confirmation:
  - updates `payment_verified_by_app`
  - missing/unknown message guid behavior
- public messages:
  - verified-only filtering
  - boost-only filtering (`action='boost'`)
  - descending order
  - scoped channel/item retrieval
  - hidden behavior when public disabled
  - message payload includes MB1 display metadata fields (`amount`, `currency`, `amount_unit`,
    `app_name`, `sender_name`, `sender_id`)
- removed legacy/non-MB1 message-write routes:
  - return 404
  - do not return compatibility payloads or redirects

## Web E2E Checklist

- bucket create with type selection (group/rss-channel)
- rss-channel default redirect to Add to RSS tab
- Add to RSS page renders canonical tag snippet and verify button
- verify success/failure status rendering
- owner/admin show-unverified toggle behavior
- non-owner/non-admin toggle absence
- RSS item list sorted by pub date with orphan warning visibility
- message cards/lists show MB1 metadata fields where available
- stream telemetry rows are not shown in current message pages
- BTC + sats displays as satoshis
- nullable `amount_unit` displays with no implied unit
- MB1 metadata labels/formatting text are localized via i18n keys
- public how-to pages are accessible without auth at `/how-to/creators` and `/how-to/developers`
- deprecated UI entry points for replaced flows are absent (no compatibility redirects)

## Documentation Checklist

- mb1 standard doc:
  - canonical tag form and attribute
  - endpoint overview and payload examples
  - error semantics
- OpenAPI:
  - all new routes, params, request/response bodies
  - auth requirements per endpoint
- Developer docs:
  - env var for parse throttle
  - parser package usage guidance
- Podverse docs:
  - public RSS asset path and URL usage note

## Release Readiness Checklist

- migration order and rollback notes documented
- no out-of-scope management app changes included
- test coverage present for every changed API/web behavior
- docs match runtime responses exactly
