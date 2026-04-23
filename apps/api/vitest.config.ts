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
    /** One retry softens rare integration flakes (I/O) without hiding systemic failures. */
    retry: 1,
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
});
