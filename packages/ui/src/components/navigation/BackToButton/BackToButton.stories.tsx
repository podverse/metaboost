import type { Meta, StoryObj } from '@storybook/react-vite';

import { BackToButton } from './BackToButton';

const meta: Meta<typeof BackToButton> = {
  component: BackToButton,
  tags: ['autodocs'],
  argTypes: {
    children: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<typeof BackToButton>;

export const Default: Story = {
  args: {
    children: 'Back to bucket',
  },
};

export const InsideLink: Story = {
  render: (args) => (
    <a href="#back" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
      <BackToButton {...args} />
    </a>
  ),
  args: {
    children: 'Back to bucket',
  },
};
