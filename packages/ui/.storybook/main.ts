import type { StorybookConfig } from '@storybook/react-vite';

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [getAbsolutePath('@storybook/addon-docs')],
  framework: {
    name: getAbsolutePath('@storybook/react-vite'),
    options: {},
  },
  async viteFinal(config) {
    const nextNavMock = join(__dirname, 'mocks', 'next-navigation.ts');
    const alias = Array.isArray(config.resolve?.alias)
      ? [...config.resolve.alias, { find: 'next/navigation', replacement: nextNavMock }]
      : { ...config.resolve?.alias, 'next/navigation': nextNavMock };
    return {
      ...config,
      resolve: {
        ...config.resolve,
        alias,
      },
    };
  },
};

export default config;

function getAbsolutePath(value: string): string {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}
