import type { Meta, StoryObj } from '@storybook/react-vite';

import { useState } from 'react';

import { LoginForm } from './LoginForm';

const meta: Meta<typeof LoginForm> = {
  component: LoginForm,
  tags: ['autodocs'],
  argTypes: {
    loading: { control: 'boolean' },
    emailError: { control: 'text' },
    passwordError: { control: 'text' },
    submitError: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<typeof LoginForm>;

function LoginFormWrapper(props: React.ComponentProps<typeof LoginForm>) {
  const [email, setEmail] = useState(props.email);
  const [password, setPassword] = useState(props.password);
  return (
    <LoginForm
      {...props}
      email={email}
      password={password}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSubmit={(e) => {
        e.preventDefault();
      }}
    />
  );
}

export const Default: Story = {
  render: (args) => (
    <LoginFormWrapper
      {...args}
      email=""
      password=""
      signupHref="#signup"
      forgotPasswordHref="#forgot"
    />
  ),
  args: {
    loading: false,
  },
};

export const WithErrors: Story = {
  render: (args) => (
    <LoginFormWrapper
      {...args}
      email="bad@"
      password=""
      signupHref="#signup"
      forgotPasswordHref="#forgot"
    />
  ),
  args: {
    loading: false,
    emailError: 'Invalid email format',
    submitError: 'Login failed. Please try again.',
  },
};

export const Loading: Story = {
  render: (args) => (
    <LoginFormWrapper
      {...args}
      email="user@example.com"
      password="••••••••"
      signupHref="#signup"
      forgotPasswordHref="#forgot"
    />
  ),
  args: {
    loading: true,
  },
};

export const NoLinks: Story = {
  render: (args) => <LoginFormWrapper {...args} email="" password="" />,
  args: {
    loading: false,
  },
};
