import type { Meta, StoryObj } from '@storybook/react-vite';

import { LoadingSpinner } from '../../feedback/LoadingSpinner';
import { Modal } from './Modal';

import styles from './Modal.stories.module.scss';

const meta: Meta<typeof Modal> = {
  component: Modal,
  tags: ['autodocs'],
  argTypes: {
    withBackdrop: { control: 'boolean' },
    backdropOpaque: { control: 'boolean' },
  },
};

export default meta;

type Story = StoryObj<typeof Modal>;

export const Transparent: Story = {
  args: {
    withBackdrop: false,
    children: <LoadingSpinner size="xl" />,
  },
};

export const WithBackdrop: Story = {
  args: {
    withBackdrop: true,
    children: <LoadingSpinner size="xl" />,
  },
};

export const WithContent: Story = {
  args: {
    withBackdrop: true,
    children: <div className={styles.content}>Modal content slot (e.g. dialog or spinner)</div>,
  },
};

export const WithOpaqueBackdrop: Story = {
  args: {
    withBackdrop: true,
    backdropOpaque: true,
    children: <div className={styles.content}>Opaque backdrop for better readability</div>,
  },
};
