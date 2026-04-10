import type { Meta, StoryObj } from '@storybook/react-vite';

import { CopyLinkBox } from './CopyLinkBox';

const meta: Meta<typeof CopyLinkBox> = {
  component: CopyLinkBox,
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'text' },
    copyLabel: { control: 'text' },
    copiedLabel: { control: 'text' },
    inputAriaLabel: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<typeof CopyLinkBox>;

export const Default: Story = {
  args: {
    value: 'https://example.com/invite/abc123',
    inputAriaLabel: 'Invite link',
  },
};

export const WithDescription: Story = {
  args: {
    value: 'https://example.com/invite/xyz789',
    description: 'Share this link to invite someone to your bucket.',
    copyLabel: 'Copy link',
    copiedLabel: 'Copied!',
    inputAriaLabel: 'Invite link',
  },
};
