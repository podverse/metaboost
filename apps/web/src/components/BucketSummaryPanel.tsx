'use client';

import type { BucketSummaryData, BucketSummaryRangePreset } from '@metaboost/helpers-requests';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { COOKIE_MAX_AGE_DAYS, ONE_DAY_SECONDS } from '@metaboost/helpers';
import { webBuckets } from '@metaboost/helpers-requests';
import { BucketSummary } from '@metaboost/ui';

import { useAuth } from '../context/AuthContext';
import { getApiBaseUrl } from '../lib/api-client';
import {
  getBucketSummaryPrefFromCookieValue,
  type BucketSummaryPref,
  type BucketSummaryView,
} from '../lib/bucketSummaryPrefs';
import { BUCKET_SUMMARY_PREFS_COOKIE_NAME } from '../lib/cookies';

type BucketSummaryPanelProps = {
  scope: 'dashboard' | 'bucket';
  bucketId?: string;
  initialSummary?: BucketSummaryData | null;
  initialPref?: BucketSummaryPref | null;
};

const BUCKET_SUMMARY_COOKIE_PATH = '/';

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

function getCookieMap(cookieName: string): Record<string, unknown> {
  if (typeof document === 'undefined') return {};
  const match = document.cookie.match(
    new RegExp('(?:^|;\\s*)' + encodeURIComponent(cookieName) + '=([^;]*)')
  );
  const encodedValue = match?.[1];
  if (encodedValue === undefined || encodedValue === '') return {};
  try {
    const decodedValue = decodeURIComponent(encodedValue);
    return parseCookieMap(decodedValue) ?? {};
  } catch {
    return {};
  }
}

function getCookieValue(cookieName: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(
    new RegExp('(?:^|;\\s*)' + encodeURIComponent(cookieName) + '=([^;]*)')
  );
  return match?.[1];
}

function writeBucketSummaryPref(
  cookieName: string,
  pathKey: string,
  pref: BucketSummaryPref
): void {
  if (typeof document === 'undefined' || pathKey === '') return;
  const existing = getCookieMap(cookieName);
  const next: Record<string, unknown> = {
    ...existing,
    [pathKey]: {
      range: pref.range,
      view: pref.view,
      ...(pref.customFrom !== undefined ? { customFrom: pref.customFrom } : {}),
      ...(pref.customTo !== undefined ? { customTo: pref.customTo } : {}),
    },
  };
  const encoded = encodeURIComponent(JSON.stringify(next));
  const maxAge = COOKIE_MAX_AGE_DAYS * ONE_DAY_SECONDS;
  document.cookie =
    encodeURIComponent(cookieName) +
    '=' +
    encoded +
    '; path=' +
    BUCKET_SUMMARY_COOKIE_PATH +
    '; max-age=' +
    maxAge +
    '; SameSite=Lax';
}

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function BucketSummaryPanel({
  scope,
  bucketId,
  initialSummary = null,
  initialPref = null,
}: BucketSummaryPanelProps) {
  const t = useTranslations('dashboardSummary');
  const pathname = usePathname();
  const { user } = useAuth();
  const [range, setRange] = useState<BucketSummaryRangePreset>(initialPref?.range ?? '30d');
  const [view, setView] = useState<BucketSummaryView>(initialPref?.view ?? 'data');
  const [customFrom, setCustomFrom] = useState<string>(
    () =>
      initialPref?.customFrom ?? toDateInputValue(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
  );
  const [customTo, setCustomTo] = useState<string>(
    () => initialPref?.customTo ?? toDateInputValue(new Date())
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<BucketSummaryData | null>(initialSummary);
  const [prefsReady, setPrefsReady] = useState(false);

  const fetchSummary = useCallback(
    async (nextRange: BucketSummaryRangePreset, from?: string, to?: string) => {
      if (scope === 'bucket' && (bucketId === undefined || bucketId === '')) {
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const baseUrl = getApiBaseUrl();
        const query =
          nextRange === 'custom'
            ? {
                range: nextRange,
                from:
                  from !== undefined ? new Date(`${from}T00:00:00.000Z`).toISOString() : undefined,
                to: to !== undefined ? new Date(`${to}T23:59:59.999Z`).toISOString() : undefined,
                baselineCurrency: user?.preferredCurrency ?? undefined,
              }
            : { range: nextRange, baselineCurrency: user?.preferredCurrency ?? undefined };
        const response =
          scope === 'dashboard'
            ? await webBuckets.reqFetchDashboardBucketSummary(baseUrl, undefined, query)
            : await webBuckets.reqFetchBucketSummary(baseUrl, bucketId as string, undefined, query);
        if (!response.ok) {
          setError(response.error.message);
          return;
        }
        if (response.data === undefined) {
          setError(t('failedToLoad'));
          return;
        }
        setSummary(response.data);
      } catch {
        setError(t('failedToLoad'));
      } finally {
        setLoading(false);
      }
    },
    [bucketId, scope, t, user?.preferredCurrency]
  );

  useEffect(() => {
    if (prefsReady) return;
    const pathKey = pathname ?? '';
    const rawCookieValue = getCookieValue(BUCKET_SUMMARY_PREFS_COOKIE_NAME);
    const savedPref = getBucketSummaryPrefFromCookieValue(rawCookieValue, pathKey);
    if (savedPref !== null) {
      setRange(savedPref.range);
      setView(savedPref.view);
      if (savedPref.customFrom !== undefined) {
        setCustomFrom(savedPref.customFrom);
      }
      if (savedPref.customTo !== undefined) {
        setCustomTo(savedPref.customTo);
      }
    }
    setPrefsReady(true);
  }, [pathname, prefsReady]);

  useEffect(() => {
    if (!prefsReady) return;
    void fetchSummary(range, customFrom, customTo);
  }, [customFrom, customTo, fetchSummary, prefsReady, range]);

  useEffect(() => {
    if (!prefsReady) return;
    const pathKey = pathname ?? '';
    writeBucketSummaryPref(BUCKET_SUMMARY_PREFS_COOKIE_NAME, pathKey, {
      range,
      view,
      customFrom,
      customTo,
    });
  }, [customFrom, customTo, pathname, prefsReady, range, view]);

  const chartData = useMemo(
    () =>
      (summary?.series ?? []).map((point) => ({
        label: new Date(point.bucketStart).toLocaleDateString(),
        amount: Number.parseFloat(point.convertedAmount),
        messages: point.messageCount,
      })),
    [summary]
  );

  return (
    <BucketSummary
      labels={{
        totalAmount: t('totalAmount'),
        totalMessages: t('totalMessages'),
        dataView: t('dataView'),
        graphView: t('graphView'),
        customFrom: t('customFrom'),
        customTo: t('customTo'),
        applyCustomRange: t('applyCustomRange'),
        loading: t('loading'),
        noChartData: t('noChartData'),
      }}
      rangeLabels={{
        '24h': t('range24h'),
        '7d': t('range7d'),
        '30d': t('range30d'),
        '1y': t('range1y'),
        'all-time': t('rangeAllTime'),
        custom: t('rangeCustom'),
      }}
      range={range}
      view={view}
      totalAmount={summary?.totals.convertedAmount ?? '0'}
      totalMessages={summary?.totals.messageCount ?? 0}
      baselineCurrency={summary?.baselineCurrency ?? user?.preferredCurrency ?? 'USD'}
      chartData={chartData}
      loading={loading && summary === null}
      error={error}
      customFrom={customFrom}
      customTo={customTo}
      onChangeRange={setRange}
      onChangeView={setView}
      onChangeCustomFrom={setCustomFrom}
      onChangeCustomTo={setCustomTo}
      onApplyCustomRange={() => {
        setRange('custom');
        void fetchSummary('custom', customFrom, customTo);
      }}
    />
  );
}
