import type { Meta, StoryObj } from '@storybook/react-vite';

import { Card } from './Card';

const meta: Meta<typeof Card> = {
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    children: 'Card content goes here.',
  },
};

export const WithTitle: Story = {
  args: {
    title: 'Card title',
    children: 'Card content with a title.',
  },
};

export const Empty: Story = {
  args: {},
};
