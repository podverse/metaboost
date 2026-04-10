import type { Meta, StoryObj } from '@storybook/react-vite';

import { FormActions } from './FormActions';

const meta: Meta<typeof FormActions> = {
  component: FormActions,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof FormActions>;

export const Default: Story = {
  args: {
    children: (
      <>
        <button type="submit">Save</button>
        <button type="button">Cancel</button>
      </>
    ),
  },
};

export const ThreeActions: Story = {
  args: {
    children: (
      <>
        <button type="submit">Save</button>
        <button type="button">Preview</button>
        <button type="button">Cancel</button>
      </>
    ),
  },
};
