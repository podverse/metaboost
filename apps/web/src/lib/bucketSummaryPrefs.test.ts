import { describe, expect, it } from 'vitest';

import { getBucketSummaryPrefFromCookieValue } from './bucketSummaryPrefs';

describe('bucketSummaryPrefs', () => {
  it('returns null for empty cookie or path key', () => {
    expect(getBucketSummaryPrefFromCookieValue(undefined, 'k')).toBeNull();
    expect(getBucketSummaryPrefFromCookieValue('', 'k')).toBeNull();
    expect(getBucketSummaryPrefFromCookieValue('{}', '')).toBeNull();
  });

  it('parses encoded cookie map entry for path key', () => {
    const raw = encodeURIComponent(
      JSON.stringify({
        '/bucket/foo': {
          range: '7d',
          view: 'data',
        },
      })
    );
    const pref = getBucketSummaryPrefFromCookieValue(raw, '/bucket/foo');
    expect(pref).toEqual({ range: '7d', view: 'data' });
  });

  it('returns null when range or view is invalid', () => {
    const raw = encodeURIComponent(
      JSON.stringify({
        '/bucket/foo': {
          range: 'invalid',
          view: 'data',
        },
      })
    );
    expect(getBucketSummaryPrefFromCookieValue(raw, '/bucket/foo')).toBeNull();
  });
});
