#!/usr/bin/env node
/**
 * Flags potentially dangerous template-literal SQL in QueryBuilder chains.
 * Allowlisted snippets are reviewed in security audits — extend only with review.
 *
 * See docs/development/SECURITY-REVIEW-CHECKLIST.md (SQL section).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '..', '..');

const SCAN_ROOTS = [
  path.join(repoRoot, 'packages/orm/src'),
  path.join(repoRoot, 'apps/api/src'),
  path.join(repoRoot, 'apps/management-api/src'),
];

/** Full-line or distinctive substring allowlist (security-reviewed). */
const ALLOW_LINE_SUBSTRINGS = [
  '.orderBy(`bucket.${orderBy}`, orderDir)',
  "andWhere(`(${conditions.join(' OR ')})`, { search:",
  "`date_trunc('${timeBucket}', msg.created_at)`",
  '`%${escaped}%`',
  '${appMetaAlias}.sender_id IS NULL',
];

function walkTsFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walkTsFiles(full, out);
    } else if (ent.isFile() && ent.name.endsWith('.ts')) {
      out.push(full);
    }
  }
  return out;
}

function contextAllowed(ctx) {
  return ALLOW_LINE_SUBSTRINGS.some((s) => ctx.includes(s));
}

function scanFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  const re =
    /\.(where|andWhere|orWhere|orderBy|groupBy|having|select)\(\s*`([^`]*\$\{[^}]+\}[^`]*)`/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const lineNum = text.slice(0, m.index).split(/\r?\n/).length;
    const ctxStart = Math.max(0, m.index - 100);
    const ctxEnd = Math.min(text.length, m.index + m[0].length + 200);
    const ctx = text.slice(ctxStart, ctxEnd);
    if (!contextAllowed(ctx)) {
      issues.push({ lineNum, snippet: m[0].replace(/\s+/g, ' ').slice(0, 140) });
    }
  }
  return issues;
}

let failed = false;
for (const root of SCAN_ROOTS) {
  for (const file of walkTsFiles(root)) {
    const rel = path.relative(repoRoot, file);
    const issues = scanFile(file);
    if (issues.length > 0) {
      failed = true;
      for (const { lineNum, snippet } of issues) {
        console.error(`${rel}:${lineNum}: suspicious dynamic SQL fragment: ${snippet}`);
      }
    }
  }
}

if (failed) {
  console.error(
    '\nAllow new patterns only after security review (extend ALLOW_LINE_SUBSTRINGS in this script).'
  );
  process.exit(1);
}
console.log('SQL dynamic-fragment scan OK (no new unlisted QueryBuilder template literals).');
