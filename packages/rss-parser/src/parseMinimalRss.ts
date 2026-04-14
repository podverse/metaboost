import type { ParsedMinimalRss, ParsedMinimalRssItem } from './types.js';

import { XMLParser } from 'fast-xml-parser';

import { MinimalRssParserError } from './errors.js';

type XmlNode = Record<string, unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function trimToUndefined(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function getNodeText(node: unknown): string | undefined {
  if (typeof node === 'string') {
    return trimToUndefined(node);
  }
  if (isRecord(node)) {
    const textNode = node['#text'];
    if (typeof textNode === 'string') {
      return trimToUndefined(textNode);
    }
  }
  return undefined;
}

function getItem(itemNode: unknown): ParsedMinimalRssItem {
  if (!isRecord(itemNode)) {
    return {};
  }
  return {
    title: getNodeText(itemNode.title),
    guid: getNodeText(itemNode.guid),
    pubDate: getNodeText(itemNode.pubDate),
  };
}

function findChannel(parsed: unknown): XmlNode {
  if (!isRecord(parsed)) {
    throw new MinimalRssParserError({
      code: 'unsupported_structure',
      message: 'Unexpected parsed RSS structure.',
      details: parsed,
    });
  }

  const rss = parsed.rss;
  if (isRecord(rss) && isRecord(rss.channel)) {
    return rss.channel;
  }

  const rdf = parsed['rdf:RDF'];
  if (isRecord(rdf) && isRecord(rdf.channel)) {
    return rdf.channel;
  }

  if (isRecord(parsed.channel)) {
    return parsed.channel;
  }

  throw new MinimalRssParserError({
    code: 'missing_channel',
    message: 'RSS channel node is missing.',
    details: parsed,
  });
}

export function parseMinimalRss(xml: string): ParsedMinimalRss {
  if (typeof xml !== 'string' || xml.trim() === '') {
    throw new MinimalRssParserError({
      code: 'invalid_input',
      message: 'RSS XML payload must be a non-empty string.',
    });
  }

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    trimValues: true,
    parseTagValue: false,
    textNodeName: '#text',
    processEntities: true,
    removeNSPrefix: false,
  });

  let parsed: unknown;
  try {
    parsed = parser.parse(xml);
  } catch (error) {
    throw new MinimalRssParserError({
      code: 'invalid_xml',
      message: 'Invalid XML payload.',
      details: error,
    });
  }

  const channel = findChannel(parsed);
  const metaBoost = channel['podcast:metaBoost'];
  const items = asArray(channel.item).map((item) => getItem(item));

  return {
    channelTitle: getNodeText(channel.title),
    podcastGuid: getNodeText(channel['podcast:guid']),
    metaBoostUrl: getNodeText(metaBoost),
    metaBoostStandard:
      isRecord(metaBoost) && typeof metaBoost['@_standard'] === 'string'
        ? trimToUndefined(metaBoost['@_standard'])
        : undefined,
    items,
  };
}
