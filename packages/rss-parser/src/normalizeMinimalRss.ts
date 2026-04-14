import type { NormalizedMinimalRss, NormalizedMinimalRssItem, ParsedMinimalRss } from './types.js';

function normalizeString(value: string | undefined): string | null {
  if (value === undefined) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function parseDateTimestamp(value: string | null): number | null {
  if (value === null) {
    return null;
  }
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
}

function normalizeItem(item: ParsedMinimalRss['items'][number]): NormalizedMinimalRssItem {
  const title = normalizeString(item.title);
  const guid = normalizeString(item.guid);
  const pubDate = normalizeString(item.pubDate);
  return {
    title,
    guid,
    pubDate,
    pubDateTimestamp: parseDateTimestamp(pubDate),
  };
}

export function normalizeMinimalRss(parsed: ParsedMinimalRss): NormalizedMinimalRss {
  const normalizedItems = parsed.items.map((item) => normalizeItem(item));
  const itemsByGuid = normalizedItems.reduce<Record<string, NormalizedMinimalRssItem>>(
    (acc, item) => {
      if (item.guid === null) {
        return acc;
      }

      const current = acc[item.guid];
      if (current === undefined) {
        acc[item.guid] = item;
        return acc;
      }

      const currentTs = current.pubDateTimestamp ?? Number.NEGATIVE_INFINITY;
      const nextTs = item.pubDateTimestamp ?? Number.NEGATIVE_INFINITY;

      // Keep newest pubDate. If equal, prefer the later item occurrence.
      if (nextTs >= currentTs) {
        acc[item.guid] = item;
      }

      return acc;
    },
    {}
  );

  return {
    channelTitle: normalizeString(parsed.channelTitle) ?? '',
    podcastGuid: normalizeString(parsed.podcastGuid) ?? '',
    metaBoostUrl: normalizeString(parsed.metaBoostUrl),
    metaBoostStandard: normalizeString(parsed.metaBoostStandard),
    items: normalizedItems,
    itemsByGuid,
  };
}
