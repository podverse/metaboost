import type { Meta, StoryObj } from '@storybook/react-vite';

import { FormSection } from './FormSection';

const meta: Meta<typeof FormSection> = {
  component: FormSection,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<typeof FormSection>;

export const Default: Story = {
  args: {
    title: 'Permissions',
    children: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label style={{ display: 'flex', gap: '0.5rem' }}>
          <input type="checkbox" /> Can read
        </label>
        <label style={{ display: 'flex', gap: '0.5rem' }}>
          <input type="checkbox" /> Can write
        </label>
      </div>
    ),
  },
};

export const WithMultipleGroups: Story = {
  args: {
    title: 'Access control',
    children: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <p style={{ margin: 0 }}>Group 1 content</p>
        <p style={{ margin: 0 }}>Group 2 content</p>
      </div>
    ),
  },
};
