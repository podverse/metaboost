'use client';

import type { BucketSummaryData, BucketSummaryRangePreset } from '@metaboost/helpers-requests';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { webBuckets } from '@metaboost/helpers-requests';
import { BucketSummary } from '@metaboost/ui';

import { useAuth } from '../context/AuthContext';
import { getApiBaseUrl } from '../lib/api-client';

type BucketSummaryPanelProps = {
  scope: 'dashboard' | 'bucket';
  bucketId?: string;
};

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function BucketSummaryPanel({ scope, bucketId }: BucketSummaryPanelProps) {
  const t = useTranslations('dashboardSummary');
  const { user } = useAuth();
  const [range, setRange] = useState<BucketSummaryRangePreset>('30d');
  const [view, setView] = useState<'data' | 'graphs'>('data');
  const [customFrom, setCustomFrom] = useState<string>(() =>
    toDateInputValue(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
  );
  const [customTo, setCustomTo] = useState<string>(() => toDateInputValue(new Date()));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<BucketSummaryData | null>(null);

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
    void fetchSummary(range, customFrom, customTo);
  }, [fetchSummary, range, customFrom, customTo]);

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
        title: t('title'),
        totalAmount: t('totalAmount'),
        totalMessages: t('totalMessages'),
        ignoredEntries: t('ignoredEntries'),
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
      ignoredConversionEntries={summary?.totals.ignoredConversionEntries ?? 0}
      baselineCurrency={summary?.baselineCurrency ?? user?.preferredCurrency ?? 'USD'}
      chartData={chartData}
      loading={loading}
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
