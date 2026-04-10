import type { CrudFlags } from './CrudCheckboxes';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { useState } from 'react';

import { CrudCheckboxes } from './CrudCheckboxes';

const defaultLabels = {
  create: 'Create',
  read: 'Read',
  update: 'Update',
  delete: 'Delete',
};

const allFalse: CrudFlags = { create: false, read: false, update: false, delete: false };
const allTrue: CrudFlags = { create: true, read: true, update: true, delete: true };
const readOnly: CrudFlags = { create: false, read: true, update: false, delete: false };

const meta: Meta<typeof CrudCheckboxes> = {
  component: CrudCheckboxes,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<typeof CrudCheckboxes>;

export const Default: Story = {
  render: function DefaultRender(args) {
    const [flags, setFlags] = useState<CrudFlags>(allFalse);
    return <CrudCheckboxes {...args} flags={flags} onChange={setFlags} />;
  },
  args: {
    label: 'Permissions',
    labels: defaultLabels,
  },
};

export const AllChecked: Story = {
  render: function AllCheckedRender(args) {
    const [flags, setFlags] = useState<CrudFlags>(allTrue);
    return <CrudCheckboxes {...args} flags={flags} onChange={setFlags} />;
  },
  args: {
    label: 'All permissions',
    labels: defaultLabels,
  },
};

export const ReadOnly: Story = {
  render: function ReadOnlyRender(args) {
    const [flags, setFlags] = useState<CrudFlags>(readOnly);
    return <CrudCheckboxes {...args} flags={flags} onChange={setFlags} />;
  },
  args: {
    label: 'Read-only permissions',
    labels: defaultLabels,
  },
};
