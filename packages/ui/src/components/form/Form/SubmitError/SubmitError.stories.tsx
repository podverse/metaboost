import type { Meta, StoryObj } from '@storybook/react-vite';

import { SubmitError } from './SubmitError';

const meta: Meta<typeof SubmitError> = {
  component: SubmitError,
  tags: ['autodocs'],
  argTypes: {
    message: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<typeof SubmitError>;

export const WithMessage: Story = {
  args: {
    message: 'Invalid email or password. Please try again.',
  },
};

export const Empty: Story = {
  args: {
    message: null,
  },
};

export const EmptyString: Story = {
  args: {
    message: '',
  },
};
