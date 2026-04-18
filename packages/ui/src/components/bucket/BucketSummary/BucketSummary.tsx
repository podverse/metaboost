'use client';

import type { ReactNode } from 'react';

import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { formatBaselineCurrencyAmount } from '@metaboost/helpers';

import { Button } from '../../form/Button/Button';
import { Card } from '../../layout/Card/Card';
import { Row } from '../../layout/Row/Row';
import { Stack } from '../../layout/Stack/Stack';
import { Text } from '../../layout/Text/Text';

import styles from './BucketSummary.module.scss';

export type BucketSummaryRangePreset = '24h' | '7d' | '30d' | '1y' | 'all-time' | 'custom';
export type BucketSummaryView = 'data' | 'graphs';

export type BucketSummaryChartPoint = {
  /** Unix ms at bucket start (UTC instant from API); drives the time X-axis. */
  atMs: number;
  amount: number;
  messages: number;
};

type ChartTimeGranularity = 'hour' | 'day' | 'month';

function inferChartGranularity(points: BucketSummaryChartPoint[]): ChartTimeGranularity {
  if (points.length < 2) {
    return 'day';
  }
  const sorted = [...points].sort((a, b) => a.atMs - b.atMs);
  const deltas: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    if (prev !== undefined && curr !== undefined) {
      deltas.push(curr.atMs - prev.atMs);
    }
  }
  const sortedDeltas = [...deltas].sort((a, b) => a - b);
  const median = sortedDeltas[Math.floor(sortedDeltas.length / 2)];
  if (median === undefined) {
    return 'day';
  }
  const hourMs = 60 * 60 * 1000;
  const dayMs = 24 * hourMs;
  if (median < 2 * hourMs) {
    return 'hour';
  }
  if (median < 2 * dayMs) {
    return 'day';
  }
  return 'month';
}

function formatChartAxisTick(
  atMs: number,
  granularity: ChartTimeGranularity,
  locale: string | undefined
): string {
  const d = new Date(atMs);
  if (granularity === 'hour') {
    return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(d);
  }
  if (granularity === 'day') {
    return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(d);
  }
  return new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' }).format(d);
}

function formatChartTooltipLabel(
  atMs: number,
  granularity: ChartTimeGranularity,
  locale: string | undefined
): string {
  const d = new Date(atMs);
  if (granularity === 'hour') {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(d);
  }
  if (granularity === 'day') {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(d);
  }
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(d);
}

function formatMessagesAxisTick(value: number | string): string {
  const n = typeof value === 'number' ? value : Number.parseFloat(String(value));
  if (!Number.isFinite(n)) {
    return '';
  }
  return String(Math.round(n));
}

type UnderlineToggleOption<T extends string> = {
  value: T;
  label: string;
};

type UnderlineToggleProps<T extends string> = {
  options: UnderlineToggleOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
};

export type BucketSummaryLabels = {
  totalAmount: string;
  totalMessages: string;
  dataView: string;
  graphView: string;
  customFrom: string;
  customTo: string;
  applyCustomRange: string;
  loading: string;
  noChartData: string;
};

export type BucketSummaryProps = {
  labels: BucketSummaryLabels;
  range: BucketSummaryRangePreset;
  view: BucketSummaryView;
  totalAmount: string;
  totalMessages: number;
  baselineCurrency: string;
  chartData: BucketSummaryChartPoint[];
  loading?: boolean;
  error?: string | null;
  customFrom?: string;
  customTo?: string;
  onChangeRange: (value: BucketSummaryRangePreset) => void;
  onChangeView: (value: BucketSummaryView) => void;
  onChangeCustomFrom: (value: string) => void;
  onChangeCustomTo: (value: string) => void;
  onApplyCustomRange: () => void;
  rangeOptions?: BucketSummaryRangePreset[];
  rangeLabels?: Partial<Record<BucketSummaryRangePreset, string>>;
  /** Passed to `Intl` for currency formatting (e.g. from next-intl `useLocale`). */
  locale?: string;
  /** Optional controls after Data/Graphs toggles (e.g. summary options menu). */
  toolbarEndSlot?: ReactNode;
};

export const DEFAULT_BUCKET_SUMMARY_RANGE_OPTIONS: BucketSummaryRangePreset[] = [
  '24h',
  '7d',
  '30d',
  '1y',
  'all-time',
  'custom',
];

function getDefaultRangeLabel(rangeValue: BucketSummaryRangePreset): string {
  if (rangeValue === 'all-time') {
    return 'All time';
  }
  if (rangeValue === 'custom') {
    return 'Custom';
  }
  return rangeValue;
}

function UnderlineToggle<T extends string>({
  options,
  selected,
  onSelect,
}: UnderlineToggleProps<T>) {
  return (
    <div className={styles.toggleGroup}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={[
            styles.toggleButton,
            selected === option.value ? styles.toggleButtonActive : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={() => onSelect(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function BucketSummary({
  labels,
  range,
  view,
  totalAmount,
  totalMessages,
  baselineCurrency,
  chartData,
  loading = false,
  error = null,
  customFrom = '',
  customTo = '',
  onChangeRange,
  onChangeView,
  onChangeCustomFrom,
  onChangeCustomTo,
  onApplyCustomRange,
  rangeOptions = DEFAULT_BUCKET_SUMMARY_RANGE_OPTIONS,
  rangeLabels,
  locale,
  toolbarEndSlot,
}: BucketSummaryProps) {
  const formattedTotalAmount = formatBaselineCurrencyAmount(totalAmount, baselineCurrency, locale);
  const formatAmountAxis = (value: number | string): string =>
    formatBaselineCurrencyAmount(value, baselineCurrency, locale);

  const chartGranularity = useMemo(() => inferChartGranularity(chartData), [chartData]);

  const rangeToggleOptions: UnderlineToggleOption<BucketSummaryRangePreset>[] = rangeOptions.map(
    (rangeValue) => ({
      value: rangeValue,
      label: rangeLabels?.[rangeValue] ?? getDefaultRangeLabel(rangeValue),
    })
  );
  const viewToggleOptions: UnderlineToggleOption<BucketSummaryView>[] = [
    { value: 'data', label: labels.dataView },
    { value: 'graphs', label: labels.graphView },
  ];

  return (
    <Card className={styles.root}>
      <Stack>
        <div className={styles.toolbar}>
          <div className={styles.toolbarRange}>
            <UnderlineToggle
              options={rangeToggleOptions}
              selected={range}
              onSelect={onChangeRange}
            />
          </div>
          <div className={styles.toolbarRight}>
            <div className={styles.toolbarViewRow}>
              <div className={styles.toolbarView}>
                <UnderlineToggle
                  options={viewToggleOptions}
                  selected={view}
                  onSelect={onChangeView}
                />
              </div>
              {toolbarEndSlot !== undefined ? (
                <div className={styles.toolbarEnd}>{toolbarEndSlot}</div>
              ) : null}
            </div>
          </div>
        </div>
        {range === 'custom' && (
          <Row wrap>
            <label className={styles.customDateField}>
              <span>{labels.customFrom}</span>
              <input
                type="date"
                value={customFrom}
                onChange={(event) => onChangeCustomFrom(event.target.value)}
              />
            </label>
            <label className={styles.customDateField}>
              <span>{labels.customTo}</span>
              <input
                type="date"
                value={customTo}
                onChange={(event) => onChangeCustomTo(event.target.value)}
              />
            </label>
            <Button type="button" variant="secondary" onClick={onApplyCustomRange}>
              {labels.applyCustomRange}
            </Button>
          </Row>
        )}
        {loading ? (
          <Text as="p">{labels.loading}</Text>
        ) : error !== null ? (
          <Text as="p" variant="error">
            {error}
          </Text>
        ) : view === 'graphs' ? (
          chartData.length === 0 ? (
            <Text as="p">{labels.noChartData}</Text>
          ) : (
            <div className={styles.chartWrap}>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    dataKey="atMs"
                    domain={['dataMin', 'dataMax']}
                    scale="time"
                    tickFormatter={(v) =>
                      formatChartAxisTick(
                        typeof v === 'number' ? v : Number(v),
                        chartGranularity,
                        locale
                      )
                    }
                    minTickGap={16}
                  />
                  <YAxis
                    yAxisId="messages"
                    orientation="left"
                    tickFormatter={formatMessagesAxisTick}
                  />
                  <YAxis yAxisId="amount" orientation="right" tickFormatter={formatAmountAxis} />
                  <Tooltip
                    labelFormatter={(label) => {
                      const ms =
                        typeof label === 'number'
                          ? label
                          : typeof label === 'string'
                            ? Number.parseFloat(label)
                            : NaN;
                      if (Number.isFinite(ms)) {
                        return formatChartTooltipLabel(ms, chartGranularity, locale);
                      }
                      return label !== undefined && label !== null ? String(label) : '';
                    }}
                    formatter={(value, name) => {
                      if (
                        name === labels.totalAmount &&
                        (typeof value === 'number' || typeof value === 'string')
                      ) {
                        return [
                          formatBaselineCurrencyAmount(value, baselineCurrency, locale),
                          labels.totalAmount,
                        ];
                      }
                      if (
                        name === labels.totalMessages &&
                        (typeof value === 'number' || typeof value === 'string')
                      ) {
                        const n =
                          typeof value === 'number' ? value : Number.parseFloat(String(value));
                        return [Number.isFinite(n) ? Math.round(n) : value, labels.totalMessages];
                      }
                      return [value, name];
                    }}
                  />
                  <Area
                    yAxisId="amount"
                    type="monotone"
                    dataKey="amount"
                    stroke="#0ea5e9"
                    fill="#0ea5e933"
                    name={labels.totalAmount}
                  />
                  <Area
                    yAxisId="messages"
                    type="monotone"
                    dataKey="messages"
                    stroke="#16a34a"
                    fill="#16a34a33"
                    name={labels.totalMessages}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )
        ) : (
          <div className={styles.metricsRow}>
            <div className={styles.metricsCol}>
              <Text as="p" className={styles.metricText}>
                {labels.totalAmount}: {formattedTotalAmount}
              </Text>
            </div>
            <div className={styles.metricsCol}>
              <Text as="p" className={styles.metricText}>
                {labels.totalMessages}: {totalMessages}
              </Text>
            </div>
          </div>
        )}
      </Stack>
    </Card>
  );
}
