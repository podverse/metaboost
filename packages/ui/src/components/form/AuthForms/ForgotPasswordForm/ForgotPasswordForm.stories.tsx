import type { Meta, StoryObj } from '@storybook/react-vite';

import { useState } from 'react';

import { ForgotPasswordForm } from './ForgotPasswordForm';

const meta: Meta<typeof ForgotPasswordForm> = {
  component: ForgotPasswordForm,
  tags: ['autodocs'],
  argTypes: {
    loading: { control: 'boolean' },
    success: { control: 'boolean' },
    emailError: { control: 'text' },
    submitError: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<typeof ForgotPasswordForm>;

function ForgotPasswordFormWrapper(props: React.ComponentProps<typeof ForgotPasswordForm>) {
  const [email, setEmail] = useState(props.email);
  return (
    <ForgotPasswordForm
      {...props}
      email={email}
      onEmailChange={setEmail}
      onSubmit={(e) => e.preventDefault()}
    />
  );
}

export const Default: Story = {
  render: (args) => <ForgotPasswordFormWrapper {...args} email="" loginHref="#login" />,
  args: { loading: false, success: false },
};

export const Success: Story = {
  render: (args) => (
    <ForgotPasswordFormWrapper {...args} email="user@example.com" loginHref="#login" />
  ),
  args: { loading: false, success: true },
};

export const WithErrors: Story = {
  render: (args) => <ForgotPasswordFormWrapper {...args} email="bad@" loginHref="#login" />,
  args: {
    loading: false,
    success: false,
    emailError: 'Invalid email format',
    submitError: 'Something went wrong.',
  },
};

export const Loading: Story = {
  render: (args) => (
    <ForgotPasswordFormWrapper {...args} email="user@example.com" loginHref="#login" />
  ),
  args: { loading: true, success: false },
};
