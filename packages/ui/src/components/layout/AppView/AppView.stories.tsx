import type { Meta, StoryObj } from '@storybook/react-vite';

import { AppView } from './AppView';

const meta: Meta<typeof AppView> = {
  component: AppView,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof AppView>;

export const Default: Story = {
  args: {
    children: 'AppView fills the viewport and establishes flex layout. Content goes here.',
  },
};
