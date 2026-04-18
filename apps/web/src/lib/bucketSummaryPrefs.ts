import type { BucketSummaryRangePreset } from '@metaboost/helpers-requests';

import {
  isDateInputYyyyMmDd,
  toUtcIsoForLocalDateEnd,
  toUtcIsoForLocalDateStart,
} from '@metaboost/helpers';

export type BucketSummaryView = 'data' | 'graphs';

export type BucketSummaryPref = {
  range: BucketSummaryRangePreset;
  view: BucketSummaryView;
  customFrom?: string;
  customTo?: string;
};

function isBucketSummaryRangePreset(value: string): value is BucketSummaryRangePreset {
  return (
    value === '24h' ||
    value === '7d' ||
    value === '30d' ||
    value === '1y' ||
    value === 'all-time' ||
    value === 'custom'
  );
}

function isBucketSummaryView(value: string): value is BucketSummaryView {
  return value === 'data' || value === 'graphs';
}

function parseCookieMap(rawValue: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(rawValue) as unknown;
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getBucketSummaryPrefFromCookieValue(
  cookieValue: string | undefined,
  pathKey: string
): BucketSummaryPref | null {
  if (cookieValue === undefined || cookieValue === '' || pathKey === '') return null;
  const map = (() => {
    try {
      const decoded =
        cookieValue.indexOf('%') !== -1 ? decodeURIComponent(cookieValue) : cookieValue;
      return parseCookieMap(decoded);
    } catch {
      return null;
    }
  })();
  if (map === null) return null;
  const entry = map[pathKey];
  if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
    return null;
  }
  const raw = entry as Record<string, unknown>;
  if (typeof raw.range !== 'string' || !isBucketSummaryRangePreset(raw.range)) {
    return null;
  }
  if (typeof raw.view !== 'string' || !isBucketSummaryView(raw.view)) {
    return null;
  }
  const pref: BucketSummaryPref = { range: raw.range, view: raw.view };
  if (typeof raw.customFrom === 'string' && isDateInputYyyyMmDd(raw.customFrom)) {
    pref.customFrom = raw.customFrom;
  }
  if (typeof raw.customTo === 'string' && isDateInputYyyyMmDd(raw.customTo)) {
    pref.customTo = raw.customTo;
  }
  return pref;
}

/**
 * Parses the bucket-summary prefs cookie for a pathname key and normalizes invalid `custom`
 * entries (missing dates) to preset `30d` while preserving `view`.
 */
export function resolveInitialBucketSummaryPref(
  cookieValue: string | undefined,
  pathKey: string
): BucketSummaryPref | null {
  const parsedPref = getBucketSummaryPrefFromCookieValue(cookieValue, pathKey);
  if (parsedPref === null) {
    return null;
  }
  const hasValidCustomRange =
    parsedPref.range === 'custom' &&
    parsedPref.customFrom !== undefined &&
    parsedPref.customTo !== undefined;
  if (parsedPref.range === 'custom' && !hasValidCustomRange) {
    return {
      range: '30d',
      view: parsedPref.view,
    };
  }
  return parsedPref;
}

/** Query shape for dashboard / single-bucket summary API calls on first load (SSR + client). */
export function buildInitialBucketSummaryApiQuery(
  initialPref: BucketSummaryPref | null,
  baselineCurrency: string | undefined
): {
  range: BucketSummaryRangePreset;
  from?: string;
  to?: string;
  baselineCurrency?: string;
} {
  const initialCustomFrom = initialPref?.customFrom;
  const initialCustomTo = initialPref?.customTo;
  const shouldUseCustomSummaryRange =
    initialPref?.range === 'custom' &&
    initialCustomFrom !== undefined &&
    initialCustomTo !== undefined;
  if (shouldUseCustomSummaryRange) {
    return {
      range: initialPref.range,
      from: toUtcIsoForLocalDateStart(initialCustomFrom) ?? undefined,
      to: toUtcIsoForLocalDateEnd(initialCustomTo) ?? undefined,
      baselineCurrency,
    };
  }
  return {
    range: initialPref?.range ?? '30d',
    baselineCurrency,
  };
}
