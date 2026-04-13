# 06 - API Boost MB1 Ingest and Confirm

## Scope

Implement mb1 capability, ingest, and payment-confirmation endpoints for boost submission.

## Endpoints

- `GET /boost/:bucketShortId`
- `POST /boost/:bucketShortId`
- `POST /boost/:bucketShortId/confirm-payment`

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
3. Validate `feed_guid` matches bucket channel guid.
4. Determine target bucket:
   - no `item_guid`: message belongs to channel bucket
   - with `item_guid`: route to matching `rss-item` bucket
   - if missing item bucket, trigger reparse-on-miss flow from Plan 05
5. Create message with `message_guid` and `payment_verified_by_app = false`.
6. Return `message_guid`.

## POST Confirm Payment Behavior

1. Validate `message_guid` exists under resolved channel context.
2. Update `payment_verified_by_app` to provided boolean.
3. Return success payload.

## Error Strategy

Use explicit business messages, for example:

- invalid feed guid for bucket
- item guid not found after reparse
- message exceeds character limit
- item title/item guid pairing invalid

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
- ingest validation failures (missing required fields, pair dependency failures)
- feed_guid mismatch
- confirm-payment success and idempotency expectation
