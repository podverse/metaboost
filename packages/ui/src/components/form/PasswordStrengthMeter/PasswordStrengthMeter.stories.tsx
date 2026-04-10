import type { Meta, StoryObj } from '@storybook/react-vite';

import { NextIntlClientProvider } from 'next-intl';

import { PasswordStrengthMeter } from './PasswordStrengthMeter';

const messages = {
  ui: {
    passwordStrength: {
      requireLength: 'At least {count} characters',
      requireMix: 'Mix of letters, numbers, and symbols',
      tooShort: 'Too short',
      weak: 'Weak',
      fair: 'Fair',
      good: 'Good',
      strong: 'Strong',
    },
  },
};

const meta: Meta<typeof PasswordStrengthMeter> = {
  component: PasswordStrengthMeter,
  tags: ['autodocs'],
  argTypes: {
    password: { control: 'text' },
  },
  render: (args) => (
    <NextIntlClientProvider locale="en" messages={messages}>
      <PasswordStrengthMeter {...args} />
    </NextIntlClientProvider>
  ),
};

export default meta;

type Story = StoryObj<typeof PasswordStrengthMeter>;

export const Empty: Story = {
  args: { password: '' },
};

export const TooShort: Story = {
  args: { password: 'ab' },
};

export const Weak: Story = {
  args: { password: 'password' },
};

export const Fair: Story = {
  args: { password: 'Password1' },
};

export const Good: Story = {
  args: { password: 'Password1!' },
};

export const Strong: Story = {
  args: { password: 'Str0ng!P@ssw0rd' },
};
