import type { Meta, StoryObj } from '@storybook/react-vite';

import { CopyButton } from './CopyButton';

const meta: Meta<typeof CopyButton> = {
  component: CopyButton,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger'],
    },
    disabled: { control: 'boolean' },
  },
};

export default meta;

type Story = StoryObj<typeof CopyButton>;

/** Min width accommodates the longer “copied” label so the button does not resize when the label swaps. */
export const ShortCopyLongCopied: Story = {
  args: {
    value: 'https://example.com/api/v1/boost/example-token',
    copyLabel: 'Copy',
    copiedLabel: 'Copied — link saved to clipboard',
  },
};

/** Min width accommodates the longer “copy” label. */
export const LongCopyShortCopied: Story = {
  args: {
    value: 'https://example.com/api/v1/boost/example-token',
    copyLabel: 'Copy ingest endpoint URL to clipboard',
    copiedLabel: 'Done!',
  },
};
