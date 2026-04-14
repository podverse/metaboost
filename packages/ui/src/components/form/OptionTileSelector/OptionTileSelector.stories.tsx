import type { Meta, StoryObj } from '@storybook/react-vite';

import { useState } from 'react';

import { OptionTileSelector } from './OptionTileSelector';

const meta: Meta<typeof OptionTileSelector> = {
  component: OptionTileSelector,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof OptionTileSelector>;

const baseOptions = [
  { value: 'rss-channel', label: 'RSS Channel', iconClassName: 'fa-solid fa-rss' },
  { value: 'rss-network', label: 'RSS Network', iconClassName: 'fa-solid fa-diagram-project' },
];

export const Default: Story = {
  render: function DefaultSelector() {
    const [value, setValue] = useState('rss-channel');
    return (
      <OptionTileSelector
        label="Bucket type"
        options={baseOptions}
        value={value}
        onChange={setValue}
      />
    );
  },
};

export const Disabled: Story = {
  args: {
    label: 'Bucket type',
    options: baseOptions,
    value: 'rss-channel',
    onChange: () => {},
    disabled: true,
  },
};
