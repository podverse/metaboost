/**
 * Load compiled messages from i18n/compiled. Path is relative to package root (parent of dist).
 * Backend only: uses Node fs/path.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { DEFAULT_LOCALE } from '@boilerplate/helpers';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.join(__dirname, '..', '..');
const compiledDir = path.join(packageRoot, 'i18n', 'compiled');

const cache = new Map<string, Record<string, unknown>>();

/**
 * Load compiled messages for a locale. Falls back to DEFAULT_LOCALE if locale file is missing.
 */
export function loadMessages(locale: string): Record<string, unknown> {
  const resolved = cache.get(locale);
  if (resolved !== undefined) return resolved;

  const pathToTry = path.join(compiledDir, `${locale}.json`);
  if (fs.existsSync(pathToTry)) {
    const raw = fs.readFileSync(pathToTry, 'utf8');
    const data = JSON.parse(raw) as Record<string, unknown>;
    cache.set(locale, data);
    return data;
  }

  const fallback = loadMessages(DEFAULT_LOCALE);
  cache.set(locale, fallback);
  return fallback;
}
