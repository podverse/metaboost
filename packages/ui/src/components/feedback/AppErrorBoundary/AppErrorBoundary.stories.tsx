import type { Meta, StoryObj } from '@storybook/react-vite';

import { AppErrorBoundary } from './AppErrorBoundary';

const strings = {
  boundaryTitle: 'Something went wrong',
  boundaryMessage: 'An unexpected error occurred.',
  detailsDevelopmentOnly: 'Error details (development only)',
  tryAgain: 'Try again',
  reloadPage: 'Reload page',
  returnToHomePage: 'Return to home',
};

const meta: Meta<typeof AppErrorBoundary> = {
  component: AppErrorBoundary,
  tags: ['autodocs'],
  args: {
    error: Object.assign(new Error('Example boundary error'), {
      stack: 'Error: Example boundary error\n    at Story.render',
      digest: 'story-digest',
    }),
    reset: () => {},
    onReload: () => {},
    onGoHome: () => {},
    strings,
  },
};

export default meta;

type Story = StoryObj<typeof AppErrorBoundary>;

export const Default: Story = {};

/** When `NODE_ENV` is `development`, the collapsible error dump is visible (Storybook dev server). */
export const DevelopmentDetailsVisible: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'With NODE_ENV=development (default in Storybook), the `<details>` block is rendered.',
      },
    },
  },
};

/** Strings prop supplies every label — matches runtime fallback when next-intl is unavailable. */
export const StringsFallbackOnly: Story = {
  args: {
    strings: {
      boundaryTitle: 'Fallback title',
      boundaryMessage: 'Fallback message body.',
      detailsDevelopmentOnly: 'Dev-only summary',
      tryAgain: 'Retry',
      reloadPage: 'Reload',
      returnToHomePage: 'Home',
    },
  },
};
