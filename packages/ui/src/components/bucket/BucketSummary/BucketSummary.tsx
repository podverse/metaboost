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

/** Amount-only chart: currency Y-axis on the right; time labels on bottom. */
const CHART_MARGIN = { top: 8, right: 28, left: 8, bottom: 14 };
const CHART_HEIGHT = 260;
const Y_AXIS_WIDTH = 46;

const MAX_AXIS_TICKS = 5;

/** Hex colors for SVG axis elements (CSS variables don't resolve in SVG presentation attributes). */
const axisStrokeMuted = '#404040';
const axisTickProps = {
  fill: '#a3a3a3',
  fontSize: 12,
  fontFamily: 'inherit',
  style: { whiteSpace: 'nowrap' as const },
};

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

function getAmountSeriesMax(points: BucketSummaryChartPoint[]): number {
  let maxValue = 0;
  for (const point of points) {
    const next = Number.isFinite(point.amount) ? point.amount : 0;
    if (next > maxValue) {
      maxValue = next;
    }
  }
  return maxValue;
}

const MIN_AMOUNT_DOMAIN_TOP = 0.04;
const HEADROOM_FACTOR = 1.2;

function niceStep(value: number): number {
  if (value <= 0 || !Number.isFinite(value)) {
    return 1;
  }
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  if (normalized <= 1) return magnitude;
  if (normalized <= 2) return 2 * magnitude;
  if (normalized <= 2.5) return 2.5 * magnitude;
  if (normalized <= 5) return 5 * magnitude;
  return 10 * magnitude;
}

function buildAmountAxisTicks(maxValue: number): number[] {
  const withHeadroom = maxValue * HEADROOM_FACTOR;
  const safeMax = Math.max(MIN_AMOUNT_DOMAIN_TOP, withHeadroom);
  const stepForDomain = safeMax <= 0.1 ? 0.01 : niceStep(safeMax / 4);
  const domainTop = Math.ceil(safeMax / stepForDomain) * stepForDomain;
  if (domainTop <= 0) {
    return [0];
  }
  const ticks: number[] = [];
  for (let i = 0; i < MAX_AXIS_TICKS; i++) {
    ticks.push(Number(((domainTop * i) / (MAX_AXIS_TICKS - 1)).toFixed(10)));
  }
  return [...new Set(ticks)].sort((a, b) => a - b);
}

/** Omit the origin tick label; Y domains still include 0 so series anchor to the baseline. */
function axisTicksOmitZero(rawTicks: number[]): number[] {
  const rest = rawTicks.filter((t) => Number.isFinite(t) && Math.abs(t) > 1e-12);
  return rest.length > 0 ? rest : rawTicks;
}

function resolveAmountAxisDomainTop(maxValue: number): number {
  const ticks = buildAmountAxisTicks(maxValue);
  return ticks[ticks.length - 1] ?? MIN_AMOUNT_DOMAIN_TOP;
}

function formatAmountAxisTickLabel(
  value: number | string,
  baselineCurrency: string,
  locale: string | undefined,
  amountTicks: number[]
): string {
  const parsed =
    typeof value === 'number'
      ? value
      : Number.parseFloat(typeof value === 'string' ? value.trim() : '');
  if (!Number.isFinite(parsed)) {
    if (typeof value === 'string' && value.trim() !== '') {
      return value.trim();
    }
    return formatBaselineCurrencyAmount(0, baselineCurrency, locale);
  }

  const code = baselineCurrency.trim().toUpperCase();
  if (code === 'BTC' || code === '') {
    return formatBaselineCurrencyAmount(parsed, baselineCurrency, locale);
  }

  const allTicksGte1 =
    amountTicks.length > 0 && amountTicks.every((t) => Number.isFinite(t) && t >= 1);

  try {
    if (allTicksGte1) {
      const isWholeUnit = Math.abs(parsed - Math.round(parsed)) < 1e-9;
      return new Intl.NumberFormat(locale, {
        currency: code,
        currencyDisplay: 'narrowSymbol',
        maximumFractionDigits: isWholeUnit ? 0 : 2,
        minimumFractionDigits: isWholeUnit ? 0 : 0,
        style: 'currency',
      }).format(parsed);
    }
    return new Intl.NumberFormat(locale, {
      currency: code,
      currencyDisplay: 'narrowSymbol',
      style: 'currency',
    }).format(parsed);
  } catch {
    return formatBaselineCurrencyAmount(parsed, baselineCurrency, locale);
  }
}

function buildChartXAxisTicks(points: BucketSummaryChartPoint[]): number[] {
  if (points.length === 0) {
    return [];
  }
  const ms = points.map((p) => p.atMs);
  const minAt = Math.min(...ms);
  const maxAt = Math.max(...ms);
  if (minAt === maxAt) {
    return [minAt];
  }
  return Array.from(
    { length: MAX_AXIS_TICKS },
    (_, i) => minAt + ((maxAt - minAt) * i) / (MAX_AXIS_TICKS - 1)
  );
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
  /** Centered title above the graphs view amount chart (e.g. “Amount”). */
  chartAmountHeading: string;
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

function AmountChartTooltipContent({
  active,
  payload,
  label,
  chartGranularity,
  locale,
  baselineCurrency,
  labels,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: BucketSummaryChartPoint }>;
  label?: string | number;
  chartGranularity: ChartTimeGranularity;
  locale: string | undefined;
  baselineCurrency: string;
  labels: BucketSummaryLabels;
}): ReactNode {
  if (!active || payload === undefined || payload.length === 0) {
    return null;
  }
  const point = payload[0]?.payload;
  if (point === undefined) {
    return null;
  }
  const msCandidate =
    typeof label === 'number' && Number.isFinite(label)
      ? label
      : typeof point.atMs === 'number'
        ? point.atMs
        : NaN;
  const ms = Number.isFinite(msCandidate)
    ? msCandidate
    : typeof label === 'string'
      ? Number.parseFloat(label)
      : NaN;
  const dateLabel = Number.isFinite(ms)
    ? formatChartTooltipLabel(ms, chartGranularity, locale)
    : '';
  const amountLabel = formatBaselineCurrencyAmount(point.amount, baselineCurrency, locale);
  const messagesRounded = Math.round(point.messages);

  return (
    <div
      style={{
        backgroundColor: '#fff',
        border: '1px solid #ccc',
        borderRadius: 4,
        color: '#333',
        fontSize: 12,
        padding: '8px 10px',
      }}
    >
      {dateLabel !== '' ? (
        <div style={{ marginBottom: 8, fontWeight: 500 }}>{dateLabel}</div>
      ) : null}
      <div style={{ marginBottom: 4 }}>
        {labels.totalAmount}: {amountLabel}
      </div>
      <div>
        {labels.totalMessages}: {messagesRounded}
      </div>
    </div>
  );
}

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

  const chartGranularity = useMemo(() => inferChartGranularity(chartData), [chartData]);
  const amountAxisMax = useMemo(() => getAmountSeriesMax(chartData), [chartData]);
  const amountTicks = useMemo(
    () => axisTicksOmitZero(buildAmountAxisTicks(amountAxisMax)),
    [amountAxisMax]
  );
  const formatAmountAxis = useMemo(
    () => (value: number | string) =>
      formatAmountAxisTickLabel(value, baselineCurrency, locale, amountTicks),
    [amountTicks, baselineCurrency, locale]
  );
  const xAxisTicks = useMemo(() => buildChartXAxisTicks(chartData), [chartData]);
  const amountDomainTop = useMemo(() => resolveAmountAxisDomainTop(amountAxisMax), [amountAxisMax]);

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
              <Text as="p" className={styles.chartHeading}>
                {labels.chartAmountHeading}
              </Text>
              <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                <AreaChart data={chartData} margin={CHART_MARGIN}>
                  <CartesianGrid strokeDasharray="3 3" stroke={axisStrokeMuted} />
                  <XAxis
                    type="number"
                    dataKey="atMs"
                    domain={['dataMin', 'dataMax']}
                    scale="time"
                    ticks={xAxisTicks}
                    tickFormatter={(v) =>
                      formatChartAxisTick(
                        typeof v === 'number' ? v : Number(v),
                        chartGranularity,
                        locale
                      )
                    }
                    tick={axisTickProps}
                    axisLine={{ stroke: axisStrokeMuted }}
                    tickLine={{ stroke: axisStrokeMuted }}
                  />
                  <YAxis
                    orientation="right"
                    width={Y_AXIS_WIDTH}
                    domain={[0, amountDomainTop]}
                    ticks={amountTicks}
                    interval={0}
                    tickFormatter={formatAmountAxis}
                    tick={axisTickProps}
                    axisLine={{ stroke: axisStrokeMuted }}
                    tickLine={{ stroke: axisStrokeMuted }}
                  />
                  <Tooltip
                    position={{ y: 0 }}
                    content={(tooltipProps) => (
                      <AmountChartTooltipContent
                        {...tooltipProps}
                        chartGranularity={chartGranularity}
                        locale={locale}
                        baselineCurrency={baselineCurrency}
                        labels={labels}
                      />
                    )}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#0ea5e9"
                    fill="#0ea5e933"
                    name={labels.totalAmount}
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
