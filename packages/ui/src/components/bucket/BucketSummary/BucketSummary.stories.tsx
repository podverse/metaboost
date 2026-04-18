import type { Meta, StoryObj } from '@storybook/react-vite';

import { useState } from 'react';

import { BucketSummary } from './BucketSummary';

const meta: Meta<typeof BucketSummary> = {
  component: BucketSummary,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof BucketSummary>;

export const Default: Story = {
  render: () => {
    const [range, setRange] = useState<'24h' | '7d' | '30d' | '1y' | 'all-time' | 'custom'>('30d');
    const [view, setView] = useState<'data' | 'graphs'>('data');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    return (
      <BucketSummary
        labels={{
          totalAmount: 'Total amount',
          totalMessages: 'Total messages',
          dataView: 'Data',
          graphView: 'Graphs',
          customFrom: 'From',
          customTo: 'To',
          applyCustomRange: 'Apply',
          loading: 'Loading summary...',
          noChartData: 'No chart data for this range.',
        }}
        rangeLabels={{
          '24h': '24h',
          '7d': '7d',
          '30d': '30d',
          '1y': '1y',
          'all-time': 'All time',
          custom: 'Custom',
        }}
        range={range}
        view={view}
        totalAmount="1892.51"
        totalMessages={104}
        baselineCurrency="USD"
        customFrom={from}
        customTo={to}
        onChangeRange={setRange}
        onChangeView={setView}
        onChangeCustomFrom={setFrom}
        onChangeCustomTo={setTo}
        onApplyCustomRange={() => {}}
        chartData={[
          { atMs: Date.UTC(2025, 3, 1), amount: 120, messages: 5 },
          { atMs: Date.UTC(2025, 3, 8), amount: 250, messages: 14 },
          { atMs: Date.UTC(2025, 3, 15), amount: 300, messages: 9 },
        ]}
      />
    );
  },
};
