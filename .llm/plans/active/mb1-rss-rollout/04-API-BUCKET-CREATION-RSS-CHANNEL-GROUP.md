# 04 - API Bucket Creation: RSS Channel and Group

## Scope

Update create-bucket APIs to support explicit bucket type selection and RSS Channel bootstrap.

## API Contract Changes

### Top-level create

- Existing route: `POST /buckets`
- New required input: `type` (`group` or `rss-channel`)

Type-specific payload:

- `group`: `name` required, valid non-empty string
- `rss-channel`: `rss_feed_url` required; `name` ignored/derived from feed channel title

### Child create

- Existing route for child bucket creation must enforce:
  - when parent is `group`, child type must be `rss-channel`
  - when parent is `rss-channel` or `rss-item`, reject manual create

## Steps

1. Update request schemas in `apps/api/src/schemas`.
2. Update controllers in `apps/api/src/controllers/bucketsController.ts`.
3. Add service logic in `BucketService`:
   - create group bucket
   - create RSS channel bucket by parsing feed URL
4. Persist RSS channel metadata in `bucket_rss_channel_info`.
5. Return serialized bucket payload including `type` and RSS-related status fields needed by web.

## Validation Rules

For `rss-channel` create:

- fetch and parse feed via minimal parser package
- require channel title and podcast guid
- if missing, return clear 400 with field reason
- store channel title as bucket name
- store parsed podcast guid in channel info

## Permission Rules

- Keep existing auth and CRUD checks.
- Ensure child-creation restrictions are enforced even for owner/admins.

## Files Likely Touched

- `apps/api/src/schemas/buckets.ts`
- `apps/api/src/controllers/bucketsController.ts`
- `apps/api/src/routes/buckets.ts`
- `packages/orm/src/services/BucketService.ts`

## Integration Tests

Add/extend tests for:

- create top-level group
- create top-level rss-channel from feed URL
- create rss-channel under group
- reject group-under-group
- reject child create under rss-channel
- reject child create under rss-item
- clear validation errors when required RSS fields missing
