import type { Meta, StoryObj } from '@storybook/react-vite';

import { LoadingSpinner } from '../../feedback/LoadingSpinner';
import { Button } from '../../form/Button';
import { Text } from '../../layout/Text/Text';
import { Modal } from './Modal';
import { ModalDialogContent } from './ModalDialogContent';

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

export const WithDialogContent: Story = {
  args: {
    withBackdrop: true,
    onClose: () => undefined,
    children: (
      <ModalDialogContent
        actions={
          <>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
            <Button type="button" variant="primary">
              Confirm
            </Button>
          </>
        }
      >
        <Text as="p">
          Use ModalDialogContent for standardized modal padding and close-button safety.
        </Text>
      </ModalDialogContent>
    ),
  },
};
