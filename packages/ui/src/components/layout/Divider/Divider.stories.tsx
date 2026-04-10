import type { Meta, StoryObj } from '@storybook/react-vite';

import { Divider } from './Divider';

const meta: Meta<typeof Divider> = {
  component: Divider,
  tags: ['autodocs'],
  argTypes: {
    className: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<typeof Divider>;

export const Default: Story = {};

export const BetweenContent: Story = {
  render: () => (
    <div>
      <p>Content above</p>
      <Divider />
      <p>Content below</p>
    </div>
  ),
};
