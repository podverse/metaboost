import type { Meta, StoryObj } from '@storybook/react-vite';

import { Form } from './Form';

const meta: Meta<typeof Form> = {
  component: Form,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<typeof Form>;

export const Default: Story = {
  args: {
    title: 'Example form',
    onSubmit: (e) => e.preventDefault(),
    children: (
      <>
        <label htmlFor="f">Field</label>
        <input id="f" type="text" />
        <button type="submit">Submit</button>
      </>
    ),
  },
};

export const WithSubmitError: Story = {
  args: {
    title: 'Form with error',
    onSubmit: (e) => e.preventDefault(),
    submitError: 'Something went wrong. Please try again.',
    children: (
      <>
        <label htmlFor="fe">Email</label>
        <input id="fe" type="email" />
        <button type="submit">Submit</button>
      </>
    ),
  },
};
