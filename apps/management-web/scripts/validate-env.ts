/* eslint-disable no-console */
/**
 * Validates management-web process env before build (Podverse-aligned).
 * The Next.js app primarily needs RUNTIME_CONFIG_URL; full public config is served by the sidecar.
 */

import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

import { buildSummary, displayValidationResults, validateHttpOrHttpsUrl } from '@metaboost/helpers';

const nodeEnv = process.env.NODE_ENV ?? 'development';
const cwd = process.cwd();

let loadedEnvFile: string | null = null;

if (nodeEnv === 'production') {
  const prodPath = resolve(cwd, '.env.production');
  const envPath = resolve(cwd, '.env');

  if (existsSync(prodPath)) {
    config({ path: prodPath });
    loadedEnvFile = prodPath;
  } else if (existsSync(envPath)) {
    config({ path: envPath });
    loadedEnvFile = envPath;
  }
} else {
  const localPath = resolve(cwd, '.env.local');
  const envPath = resolve(cwd, '.env');

  if (existsSync(localPath)) {
    config({ path: localPath });
    loadedEnvFile = localPath;
  } else if (existsSync(envPath)) {
    config({ path: envPath });
    loadedEnvFile = envPath;
  }
}

if (loadedEnvFile) {
  console.log(`Loaded env file: ${loadedEnvFile}`);
} else {
  console.log(`No .env file found (NODE_ENV=${nodeEnv})`);
}

const results = [validateHttpOrHttpsUrl('RUNTIME_CONFIG_URL', 'Runtime Config Sidecar')];
const summary = buildSummary(results);
displayValidationResults(summary);

if (summary.failed > 0) {
  console.error('\nBuild aborted: environment validation failed.\n');
  process.exit(1);
}

console.log('All required environment variables are valid.\n');
