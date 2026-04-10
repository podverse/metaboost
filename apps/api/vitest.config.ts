import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    globalSetup: ['src/test/global-setup.mjs'],
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/test/setup.ts'],
    pool: 'forks',
    fileParallelism: false,
    maxWorkers: 1, // sequential execution for reliability (Vitest 4: minWorkers removed)
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  esbuild: {
    target: 'ES2022',
  },
});
