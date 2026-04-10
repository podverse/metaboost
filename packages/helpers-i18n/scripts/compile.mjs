/**
 * Backend i18n compile: sync overrides from originals, merge originals + overrides into compiled.
 * Same three-tier pattern as apps (web, management-web). Run from package root: node scripts/compile.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(__dirname, '..');
const originalsDir = path.join(pkgRoot, 'i18n', 'originals');
const overridesDir = path.join(pkgRoot, 'i18n', 'overrides');
const compiledDir = path.join(pkgRoot, 'i18n', 'compiled');

if (!fs.existsSync(originalsDir)) {
  console.error('Originals dir not found: ' + originalsDir);
  process.exit(1);
}

function syncOverrideStructure(originals, overrides) {
  if (typeof originals !== 'object' || originals === null) return '';
  const result = {};
  for (const key of Object.keys(originals)) {
    const originalVal = originals[key];
    const overrideVal = overrides && overrides[key];
    if (typeof originalVal === 'object' && originalVal !== null) {
      result[key] = syncOverrideStructure(originalVal, overrideVal);
    } else {
      result[key] = typeof overrideVal === 'string' && overrideVal !== '' ? overrideVal : '';
    }
  }
  return result;
}

function mergeForCompiled(originals, overrides) {
  if (typeof originals !== 'object' || originals === null) {
    return typeof overrides === 'string' && overrides !== '' ? overrides : originals;
  }
  const result = {};
  for (const key of Object.keys(originals)) {
    const originalVal = originals[key];
    const overrideVal = overrides && overrides[key];
    if (typeof originalVal === 'object' && originalVal !== null) {
      result[key] = mergeForCompiled(originalVal, overrideVal);
    } else {
      result[key] =
        typeof overrideVal === 'string' && overrideVal !== '' ? overrideVal : originalVal;
    }
  }
  return result;
}

if (!fs.existsSync(overridesDir)) {
  fs.mkdirSync(overridesDir, { recursive: true });
}
if (!fs.existsSync(compiledDir)) {
  fs.mkdirSync(compiledDir, { recursive: true });
}

const localeFiles = fs
  .readdirSync(originalsDir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.replace('.json', ''));

for (const locale of localeFiles) {
  const originalsPath = path.join(originalsDir, locale + '.json');
  const overridesPath = path.join(overridesDir, locale + '.json');
  const compiledPath = path.join(compiledDir, locale + '.json');
  const originals = JSON.parse(fs.readFileSync(originalsPath, 'utf8'));

  if (locale === 'en-US') {
    fs.writeFileSync(compiledPath, JSON.stringify(originals, null, 2), 'utf8');
    console.warn('[' + 'helpers-i18n' + '] Compiled ' + locale + '.json (source)');
  } else {
    let existingOverrides = {};
    if (fs.existsSync(overridesPath)) {
      existingOverrides = JSON.parse(fs.readFileSync(overridesPath, 'utf8'));
    }
    const syncedOverrides = syncOverrideStructure(originals, existingOverrides);
    fs.writeFileSync(overridesPath, JSON.stringify(syncedOverrides, null, 2), 'utf8');
    const compiled = mergeForCompiled(originals, syncedOverrides);
    fs.writeFileSync(compiledPath, JSON.stringify(compiled, null, 2), 'utf8');
    console.warn('[' + 'helpers-i18n' + '] Compiled ' + locale + '.json');
  }
}

console.warn('[' + 'helpers-i18n' + '] i18n compile complete');
