import type { Meta, StoryObj } from '@storybook/react-vite';

import { useState } from 'react';

import { ResetPasswordForm } from './ResetPasswordForm';

const meta: Meta<typeof ResetPasswordForm> = {
  component: ResetPasswordForm,
  tags: ['autodocs'],
  argTypes: {
    loading: { control: 'boolean' },
    tokenError: { control: 'text' },
    passwordError: { control: 'text' },
    confirmError: { control: 'text' },
    submitError: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<typeof ResetPasswordForm>;

function ResetPasswordFormWrapper(props: React.ComponentProps<typeof ResetPasswordForm>) {
  const [token, setToken] = useState(props.token);
  const [password, setPassword] = useState(props.password);
  const [confirmPassword, setConfirmPassword] = useState(props.confirmPassword);
  return (
    <ResetPasswordForm
      {...props}
      token={token}
      password={password}
      confirmPassword={confirmPassword}
      onTokenChange={setToken}
      onPasswordChange={setPassword}
      onConfirmPasswordChange={setConfirmPassword}
      onSubmit={(e) => e.preventDefault()}
    />
  );
}

export const Default: Story = {
  render: (args) => (
    <ResetPasswordFormWrapper
      {...args}
      token=""
      password=""
      confirmPassword=""
      loginHref="#login"
    />
  ),
  args: {
    loading: false,
  },
};

export const WithErrors: Story = {
  render: (args) => (
    <ResetPasswordFormWrapper
      {...args}
      token=""
      password="short"
      confirmPassword="different"
      loginHref="#login"
    />
  ),
  args: {
    loading: false,
    passwordError: 'Password too short',
    confirmError: 'Passwords do not match',
    submitError: 'Reset failed.',
  },
};

export const Loading: Story = {
  render: (args) => (
    <ResetPasswordFormWrapper
      {...args}
      token="abc123"
      password="••••••••"
      confirmPassword="••••••••"
      loginHref="#login"
    />
  ),
  args: {
    loading: true,
  },
};
