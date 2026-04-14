export type MinimalRssParserErrorCode =
  | 'invalid_xml'
  | 'missing_channel'
  | 'unsupported_structure'
  | 'invalid_input';

export type ParsedMinimalRssItem = {
  title?: string;
  guid?: string;
  pubDate?: string;
};

export type ParsedMinimalRss = {
  channelTitle?: string;
  podcastGuid?: string;
  metaBoostUrl?: string;
  metaBoostStandard?: string;
  items: ParsedMinimalRssItem[];
};

export type NormalizedMinimalRssItem = {
  title: string | null;
  guid: string | null;
  pubDate: string | null;
  pubDateTimestamp: number | null;
};

export type NormalizedMinimalRss = {
  channelTitle: string;
  podcastGuid: string;
  metaBoostUrl: string | null;
  metaBoostStandard: string | null;
  items: NormalizedMinimalRssItem[];
  itemsByGuid: Record<string, NormalizedMinimalRssItem>;
};

export type MinimalRssParserErrorShape = {
  code: MinimalRssParserErrorCode;
  message: string;
  details?: unknown;
};
