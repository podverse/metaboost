import type { Meta, StoryObj } from '@storybook/react-vite';

import { useState } from 'react';

import { Textarea } from './Textarea';

const meta: Meta<typeof Textarea> = {
  component: Textarea,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    error: { control: 'text' },
    disabled: { control: 'boolean' },
    maxLength: { control: 'number' },
  },
};

export default meta;

type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  render: function DefaultRender(args) {
    const [value, setValue] = useState('');
    return <Textarea {...args} value={value} onChange={setValue} />;
  },
  args: {
    placeholder: 'Enter message',
    rows: 4,
  },
};

export const WithLabel: Story = {
  render: function WithLabelRender(args) {
    const [value, setValue] = useState('');
    return <Textarea {...args} value={value} onChange={setValue} />;
  },
  args: {
    label: 'Message',
    placeholder: 'Enter your message',
    rows: 4,
  },
};

export const WithMaxLengthAndCounter: Story = {
  render: function WithMaxLengthRender(args) {
    const [value, setValue] = useState('');
    return (
      <Textarea
        {...args}
        value={value}
        onChange={setValue}
        charCountLabel={(current, max) => `${current} / ${max}`}
      />
    );
  },
  args: {
    label: 'Message',
    placeholder: 'Enter your message',
    rows: 4,
    maxLength: 500,
  },
};

export const OverLimit: Story = {
  render: function OverLimitRender(args) {
    const [value, setValue] = useState('This message exceeds the character limit.');
    return (
      <Textarea
        {...args}
        value={value}
        onChange={setValue}
        charCountLabel={(current, max) => `${current} / ${max}`}
      />
    );
  },
  args: {
    label: 'Message',
    placeholder: 'Enter your message',
    rows: 4,
    maxLength: 20,
  },
};

export const WithError: Story = {
  render: function WithErrorRender(args) {
    const [value, setValue] = useState('');
    return <Textarea {...args} value={value} onChange={setValue} />;
  },
  args: {
    label: 'Message',
    placeholder: 'Enter your message',
    rows: 4,
    error: 'Message body is required.',
  },
};

export const Disabled: Story = {
  render: function DisabledRender(args) {
    const [value, setValue] = useState('Disabled content');
    return <Textarea {...args} value={value} onChange={setValue} />;
  },
  args: {
    label: 'Message',
    disabled: true,
    rows: 4,
  },
};
