import type { Meta, StoryObj } from '@storybook/react-vite';

import { Text } from './Text';

const meta: Meta<typeof Text> = {
  component: Text,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [undefined, 'muted', 'error'],
    },
    size: {
      control: 'select',
      options: [undefined, 'sm'],
    },
    as: {
      control: 'select',
      options: ['p', 'span'],
    },
  },
};

export default meta;

type Story = StoryObj<typeof Text>;

export const Default: Story = {
  args: {
    children: 'Default paragraph text.',
  },
};

export const Muted: Story = {
  args: {
    variant: 'muted',
    children: 'Muted secondary text.',
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    children: 'Error message text.',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small text.',
  },
};

export const AsSpan: Story = {
  args: {
    as: 'span',
    children: 'Rendered as a span.',
  },
};
