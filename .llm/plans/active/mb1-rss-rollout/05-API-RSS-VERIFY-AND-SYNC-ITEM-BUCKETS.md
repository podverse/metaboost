# 05 - API RSS Verify and Sync Item Buckets

## Scope

Add endpoint and service flow to verify channel-level mb1 tag and synchronize RSS item buckets.

## Hard-Replacement Rule

- Do not preserve deprecated verify/sync response contracts via aliases or fallback shapes.
- Keep one authoritative verify endpoint behavior; incompatible callers must receive explicit errors.

## Endpoint

- `POST /buckets/:bucketId/rss/verify`

Purpose:

- Fetch RSS feed for the channel bucket
- Verify channel-level `<podcast:metaBoost standard="mb1">` URL matches expected boost URL
- Parse items and sync RSS item buckets

## Verification State Persistence

Update `bucket_rss_channel_info`:

- always set `rss_last_parse_attempt`
- on successful parse + metaboost URL match:
  - set `rss_last_successful_parse`
  - set `rss_verified`
  - set `rss_last_parsed_feed_hash`
- on parse failure:
  - clear `rss_last_parsed_feed_hash`

## Sync Logic

1. Parse channel and item data.
2. Deduplicate by item guid (newest pubDate canonical).
3. Upsert RSS item child buckets:
   - create missing `rss-item` buckets
   - update names/pubDate when changed
4. Mark previously known item buckets absent from latest feed as `orphaned = true`.
5. Restore `orphaned = false` if an item reappears.

## Reparse Throttle + Reparse-On-Miss

Config value:

- `RSS_PARSE_MIN_INTERVAL_MS` (default 10 minutes)

Behavior for mb1 ingest with `item_guid`:

- if matching item bucket missing and last parse is stale, parse immediately then retry lookup
- if still missing after parse, return clear not-found validation error

## Business Rules

- RSS Item buckets are system-managed only.
- If channel `podcast:guid` changed in feed, update stored guid on successful parse.
- Verification failure should explain whether tag missing vs URL mismatch.

## Files Likely Touched

- `apps/api/src/routes/buckets.ts`
- `apps/api/src/controllers/*` (new rss verify controller or extension)
- `packages/orm/src/services/BucketService.ts`
- new API-level RSS sync service module

## Integration Tests

- verification success path
- verification failure: missing metaBoost tag
- verification failure: mismatched URL value
- item bucket create/update/orphan restore behavior
- parse-throttle behavior and reparse-on-miss path
