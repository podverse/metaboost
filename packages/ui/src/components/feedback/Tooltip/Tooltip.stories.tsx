import type { Meta, StoryObj } from '@storybook/react-vite';

import { Tooltip } from './Tooltip';

const meta: Meta<typeof Tooltip> = {
  component: Tooltip,
  tags: ['autodocs'],
  argTypes: {
    content: { control: 'text' },
    className: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  args: {
    content: 'Short explanation or hint.',
    children: <span tabIndex={0}>Hover or focus me</span>,
  },
};

export const WithIconTrigger: Story = {
  args: {
    content: 'Information about this field.',
    children: <span className="fa-solid fa-circle-info" role="img" aria-hidden tabIndex={0} />,
  },
};

export const LongContent: Story = {
  args: {
    content:
      'Longer tooltip text that might wrap. Use for brief help text; keep it concise for accessibility.',
    children: <span tabIndex={0}>Trigger</span>,
  },
};
