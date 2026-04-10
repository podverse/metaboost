import type { Meta, StoryObj } from '@storybook/react-vite';

import { CrudButtons } from './CrudButtons';

const meta: Meta<typeof CrudButtons> = {
  component: CrudButtons,
  tags: ['autodocs'],
  argTypes: {
    viewHref: { control: 'text' },
    viewLabel: { control: 'text' },
    editHref: { control: 'text' },
    editLabel: { control: 'text' },
    deleteLabel: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<typeof CrudButtons>;

export const DeleteOnly: Story = {
  args: {
    onDelete: () => {},
    deleteLabel: 'Delete',
  },
};

export const ViewAndDelete: Story = {
  args: {
    viewHref: '/buckets/1',
    viewLabel: 'View bucket',
    onDelete: () => {},
    deleteLabel: 'Delete',
  },
};

export const ViewEditAndDelete: Story = {
  args: {
    viewHref: '/buckets/1',
    viewLabel: 'View',
    editHref: '/buckets/1/edit',
    editLabel: 'Edit',
    onDelete: () => {},
    deleteLabel: 'Delete',
  },
};
