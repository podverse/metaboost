import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/test/vitest-setup.ts'],
    pool: 'forks',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
});
