# 01 - MB1 Spec Contract

## Scope

Lock the canonical mb1 wire contract before schema and implementation work.

## Canonical RSS Tag

Publisher places this in `<channel>`:

```xml
<podcast:metaBoost standard="mb1">https://metaboost.cc/boost/<bucketShortId>/</podcast:metaBoost>
```

Rules:

- `standard` value must be `mb1`.
- URL host can vary by environment; path shape is stable.
- Value must resolve to the RSS Channel bucket endpoint.

## GET Capability Endpoint

Route:

- `GET /boost/:bucketShortId`

Response:

- `schema: 'mb1'`
- `message_char_limit: number`
- `terms_of_service_url: string`
- `schema_definition_url: string`
- `public_messages_url?: string` (included only when public messages are enabled for the bucket)

## POST Ingest Endpoint

Route:

- `POST /boost/:bucketShortId`

Request body:

- `currency: string` required
- `amount: number` required (float allowed)
- `app_name: string` required
- `sender_name?: string`
- `sender_id?: string`
- `message?: string` (length <= `message_char_limit`)
- `feed_guid: string` required
- `feed_title: string` required
- `item_guid?: string` required when `item_title` is present
- `item_title?: string` required when `item_guid` is present

Success response:

- `message_guid: string`

Validation behavior:

- Missing/invalid values return machine-usable error messages.
- `feed_guid` must match bucket RSS channel guid.
- If `item_guid` is provided, message routes to RSS Item bucket.

## POST Payment Confirmation Endpoint

Route:

- `POST /boost/:bucketShortId/confirm-payment`

Request body:

- `message_guid: string` required
- `payment_verified_by_app: boolean` required

Response:

- 200 with updated verification state or no-content success payload.

## Public Message Endpoints

Routes:

- `GET /messages/public/:bucketShortId`
- `GET /messages/public/:bucketShortId/channel/:podcastGuid`
- `GET /messages/public/:bucketShortId/item/:itemGuid`

Rules:

- Verified messages only.
- Reverse chronological by message creation time.
- `channel/:podcastGuid` and `item/:itemGuid` must target corresponding resolved buckets.
- If public messages disabled, return forbidden/not-found behavior per privacy policy.

## Error Contract

All API errors should include:

- HTTP status code
- `message` with specific validation/business reason
- optional structured field errors (`errors[]`) where existing API patterns use them

## Documentation Outputs

- OpenAPI updates for all new routes and payloads
- MB1 standard write-up documenting canonical tag, endpoint behavior, and examples

## Key Files To Touch During Implementation

- `apps/api/src/routes/*`
- `apps/api/src/controllers/*`
- `apps/api/src/schemas/*`
- `docs/*` for mb1 spec
