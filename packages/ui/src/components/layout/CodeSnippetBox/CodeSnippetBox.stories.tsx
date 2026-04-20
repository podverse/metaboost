import type { Meta, StoryObj } from '@storybook/react-vite';

import { CodeSnippetBox } from './CodeSnippetBox';

const meta: Meta<typeof CodeSnippetBox> = {
  component: CodeSnippetBox,
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'text' },
    copyLabel: { control: 'text' },
    copiedLabel: { control: 'text' },
    copyFailedLabel: { control: 'text' },
    codeAriaLabel: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<typeof CodeSnippetBox>;

export const Default: Story = {
  args: {
    description: 'Expected tag',
    value:
      '<podcast:metaBoost standard="mbrss-v1">https://example.com/v1/standard/mbrss-v1/boost/JAyJS6QnNV/</podcast:metaBoost>',
    copyLabel: 'Copy snippet',
    copiedLabel: 'Copied!',
    copyFailedLabel: 'Copy failed',
  },
};
