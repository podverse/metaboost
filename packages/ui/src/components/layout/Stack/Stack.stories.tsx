import type { Meta, StoryObj } from '@storybook/react-vite';

import { Stack } from './Stack';

const meta: Meta<typeof Stack> = {
  component: Stack,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Stack>;

export const Default: Story = {
  args: {
    children: (
      <>
        <div>First block</div>
        <div>Second block</div>
        <div>Third block</div>
      </>
    ),
  },
};
