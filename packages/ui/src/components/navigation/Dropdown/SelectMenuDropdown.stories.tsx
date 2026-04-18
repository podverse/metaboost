import type { Meta, StoryObj } from '@storybook/react-vite';

import { useState } from 'react';

import { SelectMenuDropdown } from './SelectMenuDropdown';

const meta: Meta<typeof SelectMenuDropdown> = {
  component: SelectMenuDropdown,
  tags: ['autodocs'],
  argTypes: {
    'aria-label': { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<typeof SelectMenuDropdown>;

export const RecentOldest: Story = {
  args: {
    'aria-label': 'Sort messages',
    options: [
      { value: 'recent', label: 'Recent' },
      { value: 'oldest', label: 'Oldest' },
    ],
    value: 'recent',
    onChange: () => {},
  },
};

export const Interactive: Story = {
  render: () => {
    const [value, setValue] = useState('recent');
    return (
      <SelectMenuDropdown
        aria-label="Sort messages"
        options={[
          { value: 'recent', label: 'Recent' },
          { value: 'oldest', label: 'Oldest' },
        ]}
        value={value}
        onChange={setValue}
      />
    );
  },
};
