/**
 * Sync originals from en-US: add missing keys to each locale's originals with empty string.
 * Do not put English into non-en-US files; those must be in the target language (e.g. Spanish for es).
 * Preserves key order to match en-US so validate (key order) passes.
 * Run from repo root: node scripts/i18n/sync-originals-from-en-us.mjs <target>
 * Targets: web | management-web | helpers-i18n
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

const target = process.argv[2];
const TARGETS = ['web', 'management-web', 'helpers-i18n'];
if (!target || !TARGETS.includes(target)) {
  console.error('Usage: node scripts/i18n/sync-originals-from-en-us.mjs <target>');
  console.error('Targets: ' + TARGETS.join(' | '));
  process.exit(1);
}

function getOriginalsDir() {
  if (target === 'helpers-i18n') {
    return path.join(root, 'packages', 'helpers-i18n', 'i18n', 'originals');
  }
  return path.join(root, 'apps', target, 'i18n', 'originals');
}

const originalsDir = getOriginalsDir();
if (!fs.existsSync(originalsDir)) {
  console.error('Originals dir not found: ' + originalsDir);
  process.exit(1);
}

const enUsPath = path.join(originalsDir, 'en-US.json');
if (!fs.existsSync(enUsPath)) {
  console.error('en-US.json not found in ' + originalsDir);
  process.exit(1);
}

/**
 * Deep-merge so result has all keys from enUs in en-US order.
 * Values: from locale when present and different from en-US (real translation); when equal to en-US or missing, use ''.
 * Do not put English into non-en-US files; they must be in the target language (e.g. Spanish for es).
 */
function mergeOriginalsFromEnUs(enUs, locale) {
  if (typeof enUs !== 'object' || enUs === null) {
    if (locale !== undefined && locale !== null && locale !== enUs) return locale;
    return '';
  }
  const result = {};
  for (const key of Object.keys(enUs)) {
    const enVal = enUs[key];
    const localeVal = locale && locale[key];
    if (typeof enVal === 'object' && enVal !== null && !Array.isArray(enVal)) {
      result[key] = mergeOriginalsFromEnUs(enVal, localeVal);
    } else {
      if (localeVal !== undefined && localeVal !== null && localeVal !== enVal) {
        result[key] = localeVal;
      } else {
        result[key] = '';
      }
    }
  }
  return result;
}

const enUs = JSON.parse(fs.readFileSync(enUsPath, 'utf8'));
const localeFiles = fs
  .readdirSync(originalsDir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.replace('.json', ''));

for (const locale of localeFiles) {
  if (locale === 'en-US') continue;
  const localePath = path.join(originalsDir, locale + '.json');
  let existing = {};
  if (fs.existsSync(localePath)) {
    existing = JSON.parse(fs.readFileSync(localePath, 'utf8'));
  }
  const merged = mergeOriginalsFromEnUs(enUs, existing);
  fs.writeFileSync(localePath, JSON.stringify(merged, null, 2), 'utf8');
  console.warn('[' + target + '] Synced originals/' + locale + '.json from en-US');
}

console.warn('[' + target + '] sync-originals-from-en-us complete');
