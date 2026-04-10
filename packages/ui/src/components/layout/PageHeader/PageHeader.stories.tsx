import type { Meta, StoryObj } from '@storybook/react-vite';

import { PageHeader } from './PageHeader';

const meta: Meta<typeof PageHeader> = {
  component: PageHeader,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof PageHeader>;

export const Default: Story = {
  args: {
    title: 'Settings',
  },
};

export const LongTitle: Story = {
  args: {
    title: 'Account and privacy settings',
  },
};
