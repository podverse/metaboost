import type { Meta, StoryObj } from '@storybook/react-vite';

import { GlobalErrorBoundary } from './GlobalErrorBoundary';

const defaultStrings: Record<string, string> = {
  global_title: 'Application error',
  global_message: 'A critical error occurred. Please refresh the page.',
  details_development_only: 'Error details (development only)',
  try_again: 'Try again',
  reload_page: 'Reload page',
};

const meta: Meta<typeof GlobalErrorBoundary> = {
  component: GlobalErrorBoundary,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    settingsCookieName: 'web-settings',
    defaultStrings,
    loadStrings: async () => ({}),
    error: Object.assign(new Error('Global story error'), {
      stack: 'Error: Global story error\n    at Story.render',
    }),
    reset: () => {},
  },
};

export default meta;

type Story = StoryObj<typeof GlobalErrorBoundary>;

/** Full `<html><body>` shell with theme wrapper — invalid DOM nesting warnings in the Storybook canvas are expected. */
export const Default: Story = {};

export const LoadedStringsOverride: Story = {
  args: {
    loadStrings: async () => ({
      global_title: 'Loaded title override',
      global_message: 'Loaded message override.',
    }),
  },
};

export const AllFallbackStrings: Story = {
  args: {
    loadStrings: async () => {
      throw new Error('simulated load failure');
    },
  },
};
