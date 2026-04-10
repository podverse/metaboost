import type { Meta, StoryObj } from '@storybook/react-vite';

import { NextIntlClientProvider } from 'next-intl';
import { useState } from 'react';

import { ConfirmDeleteModal } from './ConfirmDeleteModal';

const messages = {
  common: {
    confirmDeleteBucket: {
      message: 'Are you sure you want to delete {name}? This cannot be undone.',
      fallbackName: 'this bucket',
      cancel: 'Cancel',
      delete: 'Delete',
    },
  },
};

const meta: Meta<typeof ConfirmDeleteModal> = {
  component: ConfirmDeleteModal,
  tags: ['autodocs'],
  argTypes: {
    open: { control: 'boolean' },
    displayName: { control: 'text' },
    confirmLoading: { control: 'boolean' },
  },
  render: (args) => (
    <NextIntlClientProvider locale="en" messages={messages}>
      <ConfirmDeleteModal {...args} onConfirm={() => {}} onCancel={() => {}} />
    </NextIntlClientProvider>
  ),
};

export default meta;

type Story = StoryObj<typeof ConfirmDeleteModal>;

export const Closed: Story = {
  args: {
    open: false,
    displayName: 'My Bucket',
    translationKeyPrefix: 'common.confirmDeleteBucket',
    onConfirm: () => {},
    onCancel: () => {},
  },
};

export const Open: Story = {
  args: {
    open: true,
    displayName: 'My Bucket',
    translationKeyPrefix: 'common.confirmDeleteBucket',
    onConfirm: () => {},
    onCancel: () => {},
  },
};

export const OpenWithFallbackName: Story = {
  args: {
    open: true,
    displayName: '',
    translationKeyPrefix: 'common.confirmDeleteBucket',
    onConfirm: () => {},
    onCancel: () => {},
  },
};

export const ConfirmLoading: Story = {
  args: {
    open: true,
    displayName: 'Item to delete',
    translationKeyPrefix: 'common.confirmDeleteBucket',
    confirmLoading: true,
    onConfirm: () => {},
    onCancel: () => {},
  },
};

export const Interactive: Story = {
  render: function InteractiveRender() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    return (
      <NextIntlClientProvider locale="en" messages={messages}>
        <div>
          <button type="button" onClick={() => setOpen(true)}>
            Open modal
          </button>
          <ConfirmDeleteModal
            open={open}
            displayName="My Bucket"
            translationKeyPrefix="common.confirmDeleteBucket"
            confirmLoading={loading}
            onConfirm={() => {
              setLoading(true);
              setTimeout(() => {
                setLoading(false);
                setOpen(false);
              }, 1000);
            }}
            onCancel={() => setOpen(false)}
          />
        </div>
      </NextIntlClientProvider>
    );
  },
};
