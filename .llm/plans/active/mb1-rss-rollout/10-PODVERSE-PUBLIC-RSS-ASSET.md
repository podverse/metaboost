# 10 - Podverse Public RSS Asset

## Scope

Add a minimal RSS feed as a public Podverse web asset for mb1 integration/testing.

## Target Location

- Repo: `podverse`
- Path: `apps/web/public/feeds/podverse-boosts-feed.xml`

Expected public URL shape:

- `https://<podverse-web-origin>/feeds/podverse-boosts-feed.xml`

## Feed Content Requirements

Channel:

- title: `Podverse Boosts Feed`
- include `podcast:guid` with generated unique value

Items:

- one item only
- title: `Podverse Donation Page`
- pubDate: current date when file is created

Namespace:

- include required RSS and podcast namespace declarations for `podcast:guid`

## Implementation Steps

1. Create static XML file under the target public path.
2. Ensure valid XML encoding and RSS envelope.
3. Add short docs note in Podverse docs describing location and purpose.
4. Confirm no runtime code changes are needed for static serving.

## Validation

- File available from local Next static path.
- XML parses and contains required channel/item fields.

## Notes

- Keep this feed minimal and stable; avoid content that requires frequent regeneration.
- If pubDate reproducibility is needed later, switch to a documented fixed timestamp.
