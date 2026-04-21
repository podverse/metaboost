#!/usr/bin/env node
/**
 * Regression guard: user-influenced RSS fetches must go through rss-safe-fetch
 * (assertSafeRssDestination, redirect cap, body limit). Fails if required call sites
 * stop importing the safe entrypoint.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '..', '..');

const REQUIRED = [
  {
    file: path.join(repoRoot, 'apps/api/src/controllers/bucketsController.ts'),
    mustImport: '../lib/rss-safe-fetch.js',
    mustReference: 'fetchRssFeedXmlWithTimeout',
  },
  {
    file: path.join(repoRoot, 'apps/api/src/lib/rss-sync.ts'),
    mustImport: './rss-safe-fetch.js',
    mustReference: 'fetchRssFeedXmlWithTimeout',
  },
];

let failed = false;
for (const { file, mustImport, mustReference } of REQUIRED) {
  if (!fs.existsSync(file)) {
    console.error(`security: RSS wiring — missing file: ${path.relative(repoRoot, file)}`);
    failed = true;
    continue;
  }
  const text = fs.readFileSync(file, 'utf8');
  if (!text.includes(`from '${mustImport}'`) && !text.includes(`from "${mustImport}"`)) {
    console.error(
      `security: RSS wiring — ${path.relative(repoRoot, file)} must import from '${mustImport}'`
    );
    failed = true;
  }
  if (!text.includes(mustReference)) {
    console.error(
      `security: RSS wiring — ${path.relative(repoRoot, file)} must use ${mustReference}`
    );
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}
console.log('RSS outbound wiring OK (bucketsController + rss-sync use rss-safe-fetch).');
