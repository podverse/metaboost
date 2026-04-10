import type { Meta, StoryObj } from '@storybook/react-vite';

import { useState } from 'react';

import { Select } from './Select';

const meta: Meta<typeof Select> = {
  component: Select,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Select>;

const options = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B' },
  { value: 'c', label: 'Option C' },
];

export const Default: Story = {
  render: function DefaultSelect() {
    const [value, setValue] = useState('b');
    return <Select label="Choose one" options={options} value={value} onChange={setValue} />;
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Theme',
    options: [
      { value: 'light', label: 'Light' },
      { value: 'dark', label: 'Dark' },
      { value: 'dracula', label: 'Dracula' },
    ],
    value: 'dark',
    onChange: () => {},
  },
};
