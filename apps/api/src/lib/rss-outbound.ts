import { MinimalRssParserError } from '@metaboost/rss-parser';

import { config } from '../config/index.js';

/**
 * Blocked when API_RSS_FEED_FETCH_ENABLED is off — no HTTPS to publisher feeds.
 * Bucket creation also allows only MetaBoost custom types (mb-root / mb-mid / mb-leaf); see bucketsController.
 */
export function assertRssOutboundFetchEnabled(): void {
  if (!config.rssFeedFetchEnabled) {
    throw new MinimalRssParserError({
      code: 'invalid_input',
      message:
        'RSS feed fetching is disabled (set API_RSS_FEED_FETCH_ENABLED=true). Cannot verify or sync feeds over HTTPS.',
    });
  }
}
