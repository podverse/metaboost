/**
 * Regression guard (M4): auth route rate limiters stay wired on management-api.
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('auth route rate limit wiring (management-api)', () => {
  it('applies moderateAuthRateLimiter to POST /refresh, POST /logout, and POST /change-password', () => {
    const src = readFileSync(join(__dirname, '../routes/auth.ts'), 'utf8');
    expect(src).toMatch(/router\.post\(\s*['"]\/refresh['"]\s*,\s*moderateAuthRateLimiter/s);
    expect(src).toMatch(/router\.post\(\s*['"]\/logout['"]\s*,\s*moderateAuthRateLimiter/s);
    expect(src).toMatch(
      /router\.post\(\s*['"]\/change-password['"]\s*,\s*moderateAuthRateLimiter/s
    );
  });

  it('applies loginRateLimiter to POST /login', () => {
    const src = readFileSync(join(__dirname, '../routes/auth.ts'), 'utf8');
    expect(src).toMatch(/router\.post\(\s*['"]\/login['"]\s*,\s*loginRateLimiter/s);
  });
});
