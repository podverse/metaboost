/**
 * Regression guard (M4): moderate rate limiters stay wired on refresh/logout per audit.
 * Does not assert 429 thresholds (NODE_ENV=test uses high limits in helpers-backend-api).
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('auth route rate limit wiring (api)', () => {
  it('applies moderateAuthRateLimiter to POST /refresh and POST /logout', () => {
    const src = readFileSync(join(__dirname, '../routes/auth.ts'), 'utf8');
    expect(src).toMatch(/router\.post\(\s*['"]\/refresh['"]\s*,\s*moderateAuthRateLimiter/s);
    expect(src).toMatch(/router\.post\(\s*['"]\/logout['"]\s*,\s*moderateAuthRateLimiter/s);
  });

  it('applies strictAuthRateLimiter to POST /login', () => {
    const src = readFileSync(join(__dirname, '../routes/auth.ts'), 'utf8');
    expect(src).toMatch(/router\.post\(\s*['"]\/login['"]\s*,\s*strictAuthRateLimiter/s);
  });
});
