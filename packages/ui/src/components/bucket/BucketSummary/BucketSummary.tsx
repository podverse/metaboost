'use client';

import type { ReactNode } from 'react';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

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

export type BucketSummaryLabels = {
  title: string;
  totalAmount: string;
  totalMessages: string;
  ignoredEntries: string;
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
  ignoredConversionEntries: number;
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
  headingSlot?: ReactNode;
  rangeOptions?: BucketSummaryRangePreset[];
  rangeLabels?: Partial<Record<BucketSummaryRangePreset, string>>;
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

export function BucketSummary({
  labels,
  range,
  view,
  totalAmount,
  totalMessages,
  ignoredConversionEntries,
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
  headingSlot,
  rangeOptions = DEFAULT_BUCKET_SUMMARY_RANGE_OPTIONS,
  rangeLabels,
}: BucketSummaryProps) {
  return (
    <Card className={styles.root}>
      <Stack>
        <Row justify="space-between">
          <h2 className={styles.title}>{labels.title}</h2>
          {headingSlot}
        </Row>
        <Row wrap>
          {rangeOptions.map((rangeValue) => (
            <Button
              key={rangeValue}
              type="button"
              variant={range === rangeValue ? 'primary' : 'secondary'}
              onClick={() => onChangeRange(rangeValue)}
            >
              {rangeLabels?.[rangeValue] ?? getDefaultRangeLabel(rangeValue)}
            </Button>
          ))}
        </Row>
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
        <Row wrap>
          <Button
            type="button"
            variant={view === 'data' ? 'primary' : 'secondary'}
            onClick={() => onChangeView('data')}
          >
            {labels.dataView}
          </Button>
          <Button
            type="button"
            variant={view === 'graphs' ? 'primary' : 'secondary'}
            onClick={() => onChangeView('graphs')}
          >
            {labels.graphView}
          </Button>
        </Row>
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
                  <YAxis yAxisId="amount" orientation="left" />
                  <YAxis yAxisId="messages" orientation="right" />
                  <Tooltip />
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
          <Stack>
            <Text as="p">
              {labels.totalAmount}: {totalAmount} {baselineCurrency}
            </Text>
            <Text as="p">
              {labels.totalMessages}: {totalMessages}
            </Text>
            <Text as="p">
              {labels.ignoredEntries}: {ignoredConversionEntries}
            </Text>
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
