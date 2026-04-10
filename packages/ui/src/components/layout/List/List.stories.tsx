import type { Meta, StoryObj } from '@storybook/react-vite';

import { List } from './List';

const meta: Meta<typeof List> = {
  component: List,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: [undefined, 'sm'],
    },
  },
};

export default meta;

type Story = StoryObj<typeof List>;

export const Default: Story = {
  args: {
    children: (
      <>
        <li>First item</li>
        <li>Second item</li>
        <li>Third item</li>
      </>
    ),
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    children: (
      <>
        <li>Small list item one</li>
        <li>Small list item two</li>
      </>
    ),
  },
};
