'use client';

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
  label: string;
  amount: number;
  messages: number;
};

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
}: BucketSummaryProps) {
  const formattedTotalAmount = formatBaselineCurrencyAmount(totalAmount, baselineCurrency, locale);
  const formatAmountAxis = (value: number | string): string =>
    formatBaselineCurrencyAmount(value, baselineCurrency, locale);

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
          <div className={styles.toolbarView}>
            <UnderlineToggle options={viewToggleOptions} selected={view} onSelect={onChangeView} />
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
                  <XAxis dataKey="label" />
                  <YAxis yAxisId="amount" orientation="left" tickFormatter={formatAmountAxis} />
                  <YAxis yAxisId="messages" orientation="right" />
                  <Tooltip
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
