import type { Meta, StoryObj } from '@storybook/react-vite';

import { useState } from 'react';

import { Input } from './Input';

const meta: Meta<typeof Input> = {
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    error: { control: 'text' },
    disabled: { control: 'boolean' },
  },
};

export default meta;

type Story = StoryObj<typeof Input>;

export const Default: Story = {
  render: function DefaultRender(args) {
    const [value, setValue] = useState('');
    return <Input {...args} value={value} onChange={setValue} />;
  },
  args: {
    placeholder: 'Enter text',
  },
};

export const WithLabel: Story = {
  render: function WithLabelRender(args) {
    const [value, setValue] = useState('');
    return <Input {...args} value={value} onChange={setValue} />;
  },
  args: {
    label: 'Email',
    placeholder: 'you@example.com',
    type: 'email',
  },
};

export const WithError: Story = {
  render: function WithErrorRender(args) {
    const [value, setValue] = useState('bad@');
    return <Input {...args} value={value} onChange={setValue} />;
  },
  args: {
    label: 'Email',
    placeholder: 'you@example.com',
    error: 'Please enter a valid email address',
  },
};

export const Disabled: Story = {
  render: function DisabledRender(args) {
    const [value, setValue] = useState('Disabled value');
    return <Input {...args} value={value} onChange={setValue} />;
  },
  args: {
    label: 'Disabled',
    disabled: true,
  },
};
