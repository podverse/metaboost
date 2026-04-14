import { describe, expect, it } from 'vitest';

import {
  MinimalRssParserError,
  hashFeedContent,
  normalizeMinimalRss,
  parseMinimalRss,
} from './index.js';

describe('rss-parser', () => {
  it('parses happy path channel and items', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:podcast="https://podcastindex.org/namespace/1.0">
  <channel>
    <title>Sample Feed</title>
    <podcast:guid>feed-guid-001</podcast:guid>
    <podcast:metaBoost standard="mb1">https://metaboost.example/s/mb1/boost/abc123</podcast:metaBoost>
    <item>
      <title>Episode A</title>
      <guid>item-001</guid>
      <pubDate>Mon, 11 Apr 2026 10:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

    const parsed = parseMinimalRss(xml);
    expect(parsed.channelTitle).toBe('Sample Feed');
    expect(parsed.podcastGuid).toBe('feed-guid-001');
    expect(parsed.metaBoostUrl).toBe('https://metaboost.example/s/mb1/boost/abc123');
    expect(parsed.metaBoostStandard).toBe('mb1');
    expect(parsed.items).toHaveLength(1);

    const normalized = normalizeMinimalRss(parsed);
    expect(normalized.channelTitle).toBe('Sample Feed');
    expect(normalized.podcastGuid).toBe('feed-guid-001');
    expect(normalized.itemsByGuid['item-001']?.title).toBe('Episode A');
  });

  it('supports missing channel title and guid as optional parser fields', () => {
    const xml = `<?xml version="1.0"?>
<rss version="2.0" xmlns:podcast="https://podcastindex.org/namespace/1.0">
  <channel>
    <podcast:metaBoost standard="mb1">https://example.com/boost</podcast:metaBoost>
    <item><guid>only-item</guid></item>
  </channel>
</rss>`;

    const parsed = parseMinimalRss(xml);
    expect(parsed.channelTitle).toBeUndefined();
    expect(parsed.podcastGuid).toBeUndefined();

    const normalized = normalizeMinimalRss(parsed);
    expect(normalized.channelTitle).toBe('');
    expect(normalized.podcastGuid).toBe('');
  });

  it('handles missing metaBoost tag as optional', () => {
    const xml = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>No MetaBoost</title>
    <podcast:guid xmlns:podcast="https://podcastindex.org/namespace/1.0">guid-x</podcast:guid>
  </channel>
</rss>`;

    const parsed = parseMinimalRss(xml);
    expect(parsed.metaBoostUrl).toBeUndefined();

    const normalized = normalizeMinimalRss(parsed);
    expect(normalized.metaBoostUrl).toBeNull();
  });

  it('dedupes duplicate item guid by newest pubDate and tie-breaks on later item', () => {
    const xml = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Dedup Feed</title>
    <item>
      <title>Old</title>
      <guid>dup-guid</guid>
      <pubDate>Mon, 11 Apr 2026 09:00:00 GMT</pubDate>
    </item>
    <item>
      <title>New</title>
      <guid>dup-guid</guid>
      <pubDate>Mon, 11 Apr 2026 10:00:00 GMT</pubDate>
    </item>
    <item>
      <title>Tie Winner</title>
      <guid>dup-guid</guid>
      <pubDate>Mon, 11 Apr 2026 10:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

    const parsed = parseMinimalRss(xml);
    const normalized = normalizeMinimalRss(parsed);
    expect(normalized.itemsByGuid['dup-guid']?.title).toBe('Tie Winner');
  });

  it('returns structured invalid_xml error for malformed XML', () => {
    const malformed = '<rss><channel><title>broken</title></channel>';
    let caught: unknown;
    try {
      parseMinimalRss(malformed);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(MinimalRssParserError);
    if (!(caught instanceof MinimalRssParserError)) {
      throw new Error('Expected MinimalRssParserError for malformed XML');
    }
    expect(caught.code).toBe('invalid_xml');
  });

  it('ignores unrelated tags and namespaces', () => {
    const xml = `<?xml version="1.0"?>
<rss version="2.0" xmlns:podcast="https://podcastindex.org/namespace/1.0" xmlns:foo="urn:foo">
  <channel>
    <title>Namespace Feed</title>
    <podcast:guid>guid-namespace</podcast:guid>
    <foo:ignoredTag>ignored value</foo:ignoredTag>
    <item>
      <title>Item</title>
      <guid>item-01</guid>
      <foo:extra>drop me</foo:extra>
    </item>
  </channel>
</rss>`;

    const parsed = parseMinimalRss(xml);
    expect(parsed.channelTitle).toBe('Namespace Feed');
    expect(parsed.items[0]?.guid).toBe('item-01');
  });

  it('hashes feed content deterministically with sha256', () => {
    const xml = '<rss><channel><title>Hash Me</title></channel></rss>';
    const first = hashFeedContent(xml);
    const second = hashFeedContent(xml);

    expect(first).toBe(second);
    expect(first).toHaveLength(64);
  });
});
