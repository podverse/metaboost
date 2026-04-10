import type { Meta, StoryObj } from '@storybook/react-vite';

import { LoadingSpinner } from './LoadingSpinner';

import styles from './LoadingSpinner.stories.module.scss';

const meta: Meta<typeof LoadingSpinner> = {
  component: LoadingSpinner,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg', 'xl'] },
    variant: { control: 'select', options: ['default', 'primary'] },
  },
};

export default meta;

type Story = StoryObj<typeof LoadingSpinner>;

export const Default: Story = {
  args: {},
};

export const Primary: Story = {
  args: { variant: 'primary' },
};

export const Sizes: Story = {
  render: () => (
    <div className={styles.sizesRow}>
      <LoadingSpinner size="sm" />
      <LoadingSpinner size="md" />
      <LoadingSpinner size="lg" />
      <LoadingSpinner size="xl" />
    </div>
  ),
};
