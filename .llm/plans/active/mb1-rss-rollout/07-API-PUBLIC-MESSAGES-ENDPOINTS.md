# 07 - API Public Messages Endpoints

## Scope

Implement mb1-compatible public message retrieval endpoints with verified-only semantics.

## Endpoints

- `GET /messages/public/:bucketShortId`
- `GET /messages/public/:bucketShortId/channel/:podcastGuid`
- `GET /messages/public/:bucketShortId/item/:itemGuid`

## Behavior

### Base endpoint

- Return verified messages across eligible scope for the given root bucket context.
- Sort reverse chronological by message creation timestamp.

### Channel filter endpoint

- Resolve channel by `podcastGuid` in context of `bucketShortId`.
- Return verified messages from that channel bucket.

### Item filter endpoint

- Resolve item by `itemGuid` under channel context.
- Return verified messages for that item bucket.

## Visibility Rules

- Include `public_messages_url` in capability endpoint only if public messages enabled.
- If public messages disabled:
  - omit URL from capability
  - endpoint access returns configured forbidden/not-found behavior

## Query Parameters (optional)

- page/limit support if existing API conventions require pagination
- preserve consistent max limits and defaults with current message APIs

## Serialization

Return fields safe for public consumption only, aligned with existing message serializers.

## Files Likely Touched

- `apps/api/src/routes/*`
- `apps/api/src/controllers/bucketMessagesController.ts` or a dedicated public controller
- `packages/orm/src/services/BucketMessageService.ts`

## Integration Tests

- verified-only filtering
- ordering descending by created date
- channel and item scoped retrieval
- hidden access when public messages disabled
- behavior with empty results and invalid ids
