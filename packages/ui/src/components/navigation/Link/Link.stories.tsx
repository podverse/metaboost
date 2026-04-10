import type { Meta, StoryObj } from '@storybook/react-vite';

import { Link } from './Link';

const meta: Meta<typeof Link> = {
  component: Link,
  tags: ['autodocs'],
  argTypes: {
    href: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<typeof Link>;

export const Default: Story = {
  args: {
    href: '/example',
    children: 'Example link',
  },
};

export const WithClassName: Story = {
  args: {
    href: '/styled',
    className: 'text-primary',
    children: 'Styled link',
  },
};
