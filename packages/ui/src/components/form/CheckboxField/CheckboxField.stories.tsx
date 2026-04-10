import type { Meta, StoryObj } from '@storybook/react-vite';

import { useState } from 'react';

import { CheckboxField } from './CheckboxField';

const meta: Meta<typeof CheckboxField> = {
  component: CheckboxField,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    disabled: { control: 'boolean' },
  },
};

export default meta;

type Story = StoryObj<typeof CheckboxField>;

export const Default: Story = {
  render: function DefaultRender(args) {
    const [checked, setChecked] = useState(false);
    return <CheckboxField {...args} checked={checked} onChange={setChecked} />;
  },
  args: {
    label: 'Enable feature',
  },
};

export const Checked: Story = {
  render: function CheckedRender(args) {
    const [checked, setChecked] = useState(true);
    return <CheckboxField {...args} checked={checked} onChange={setChecked} />;
  },
  args: {
    label: 'Feature enabled',
  },
};

export const Disabled: Story = {
  render: function DisabledRender(args) {
    const [checked, setChecked] = useState(false);
    return <CheckboxField {...args} checked={checked} onChange={setChecked} />;
  },
  args: {
    label: 'Unavailable option',
    disabled: true,
  },
};

export const DisabledChecked: Story = {
  render: function DisabledCheckedRender(args) {
    const [checked, setChecked] = useState(true);
    return <CheckboxField {...args} checked={checked} onChange={setChecked} />;
  },
  args: {
    label: 'Locked option',
    disabled: true,
  },
};
