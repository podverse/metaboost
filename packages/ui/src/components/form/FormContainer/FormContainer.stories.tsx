import type { Meta, StoryObj } from '@storybook/react-vite';

import { FormContainer } from './FormContainer';

const meta: Meta<typeof FormContainer> = {
  component: FormContainer,
  tags: ['autodocs'],
  argTypes: {
    constrainWidth: { control: 'boolean' },
    onSubmit: { action: 'submitted' },
  },
};

export default meta;

type Story = StoryObj<typeof FormContainer>;

export const Default: Story = {
  args: {
    constrainWidth: true,
  },
  render: (args) => (
    <FormContainer {...args} onSubmit={(e) => e.preventDefault()}>
      <p>Form content goes inside. Use FormSection, Input, Button, etc.</p>
    </FormContainer>
  ),
};

export const Unconstrained: Story = {
  args: {
    constrainWidth: false,
  },
  render: (args) => (
    <FormContainer {...args} onSubmit={(e) => e.preventDefault()}>
      <p>This form expands to fill its container.</p>
    </FormContainer>
  ),
};
