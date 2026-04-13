# 07 - API Public Messages Endpoints

## Scope

Implement mb1-compatible public message retrieval endpoints with verified-only, boost-only semantics.

## Endpoints

- MB1 standard paths:
  - `GET /messages/public/:bucketShortId`
  - `GET /messages/public/:bucketShortId/channel/:podcastGuid`
  - `GET /messages/public/:bucketShortId/item/:itemGuid`
- MetaBoost implementation mapping:
  - `GET /v1/s/mb1/messages/public/:bucketShortId`
  - `GET /v1/s/mb1/messages/public/:bucketShortId/channel/:podcastGuid`
  - `GET /v1/s/mb1/messages/public/:bucketShortId/item/:itemGuid`

## Behavior

### Base endpoint

- Return verified messages across eligible scope for the given root bucket context.
- Return only `action='boost'` messages (exclude `action='stream'`).
- Sort reverse chronological by message creation timestamp.
- Include all available MB1 message metadata fields required by UI display:
  `amount`, `currency`, `amount_unit`, `app_name`, `sender_name`, `sender_id`, `message_guid`.

### Channel filter endpoint

- Resolve channel by `podcastGuid` in context of `bucketShortId`.
- Return verified messages from that channel bucket.

### Item filter endpoint

- Resolve item by `itemGuid` under channel context.
- Return verified messages for that item bucket.

## Visibility Rules

- Include `public_messages_url` in capability endpoint only if public messages enabled.
- Current public message endpoints intentionally exclude stream telemetry rows.
- If public messages disabled:
  - omit URL from capability
  - endpoint access returns configured forbidden/not-found behavior

## Query Parameters (optional)

- page/limit support if existing API conventions require pagination
- preserve consistent max limits and defaults with current message APIs

## Serialization

Return fields safe for public consumption only, aligned with existing message serializers.
Do not strip MB1 display metadata needed for message cards/lists. Preserve `amount_unit = NULL`
when unit is omitted at ingest.

## Files Likely Touched

- `apps/api/src/routes/*`
- `apps/api/src/controllers/bucketMessagesController.ts` or a dedicated public controller
- `packages/orm/src/services/BucketMessageService.ts`

## Integration Tests

- verified-only filtering
- boost-only filtering (`action='boost'`)
- ordering descending by created date
- channel and item scoped retrieval
- hidden access when public messages disabled
- behavior with empty results and invalid ids
