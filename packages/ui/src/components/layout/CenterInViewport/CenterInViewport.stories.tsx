import type { Meta, StoryObj } from '@storybook/react-vite';

import { CenterInViewport } from './CenterInViewport';

const meta: Meta<typeof CenterInViewport> = {
  component: CenterInViewport,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    contentMaxWidth: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<typeof CenterInViewport>;

export const Default: Story = {
  args: {
    children: 'Centered content in the viewport.',
  },
};

export const WithTitle: Story = {
  args: {
    title: 'Welcome',
    children: 'Centered content with a title above.',
  },
};

export const CustomMaxWidth: Story = {
  args: {
    title: 'Narrow content',
    contentMaxWidth: '16rem',
    children: 'This content area has a max-width of 16rem.',
  },
};
