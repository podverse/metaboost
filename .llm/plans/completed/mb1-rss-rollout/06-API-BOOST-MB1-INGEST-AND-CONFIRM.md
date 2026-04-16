# 06 - API Boost MB1 Ingest (historical plan)

## Scope

Implement MB1 capability and ingest for boost submission. (A separate payment-confirmation route was removed; see current [`docs/MB1-SPEC-CONTRACT.md`](../../../../docs/MB1-SPEC-CONTRACT.md).)

## Hard-Replacement Rule

- Do not add compatibility aliases for old/non-MB1 message write paths.
- Removed/old write surfaces must stay hard-removed (404), with no redirect or fallback handling.

## Endpoints

- MB1 standard paths:
  - `GET /boost/:bucketShortId`
  - `POST /boost/:bucketShortId`
- MetaBoost implementation mapping:
  - `GET /v1/s/mb1/boost/:bucketShortId`
  - `POST /v1/s/mb1/boost/:bucketShortId`

## GET Capability Response

Return:

- `schema: 'mb1'`
- `message_char_limit`
- `terms_of_service_url`
- `schema_definition_url`
- `public_messages_url` when public messages are enabled

## POST Ingest Behavior

1. Resolve bucket by shortId; must be `rss-channel`.
2. Validate body shape and field requirements.
   - `amount_unit` is optional and must be persisted as `NULL` when omitted.
   - `action` is required and must be one of `boost | stream`.
   - include optional fields `app_version`, `podcast_index_feed_id`, and `time_position`.
3. Validate `feed_guid` matches bucket channel guid.
4. Determine target bucket:
   - no `item_guid`: message belongs to channel bucket
   - with `item_guid`: route to matching `rss-item` bucket
   - if missing item bucket, trigger reparse-on-miss flow from Plan 05
5. Persist/request-handle by action:
   - `action='boost'`: create display message row with `message_guid` and MB1 metadata (`amount`,
     `currency`, `amount_unit`, `app_name`, `app_version`, `sender_name`, `sender_id`,
     `podcast_index_feed_id`, `time_position`).
   - `action='stream'`: accept and persist stream telemetry shape as needed for future retrieval paths,
     but do not create a display-intended message flow response.
6. Response shape:
   - `action='boost'`: return `message_guid`.
   - `action='stream'`: return explicit `message_sent=false` style response.

## Error Strategy

Use explicit business messages, for example:

- invalid feed guid for bucket
- item guid not found after reparse
- message exceeds character limit
- item title/item guid pairing invalid

## Display Contract Notes

- API serializers for MB1 message responses must expose all available MB1 metadata fields for UI
  rendering.
- Current message serializers/endpoints must only expose `action='boost'` records.
- BTC + sats rendering contract: when `currency='BTC'` and `amount_unit='sats'`, clients display
  the amount as satoshis.
- `amount_unit = NULL` must be returned as null (no inferred unit).

## Security and Abuse Considerations

- Apply existing rate-limit middleware patterns if available.
- Avoid leaking private bucket topology in public error messages.
- Keep logs contextual but avoid sensitive payload dumps.

## Files Likely Touched

- `apps/api/src/routes/*` (new boost route file or expanded buckets route)
- `apps/api/src/controllers/*`
- `apps/api/src/schemas/*`
- `packages/orm/src/services/BucketMessageService.ts`

## Integration Tests

- capability endpoint happy path
- ingest success (channel-level and item-level)
- ingest success for both actions:
  - `boost` returns message guid
  - `stream` returns no-message-sent response and is excluded from current message retrieval endpoints
- ingest validation failures (missing required fields, pair dependency failures)
- feed_guid mismatch
