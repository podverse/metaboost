import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { hashRequestBody } from './hash/hashRequestBody.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, '..', 'fixtures');

describe('consumer example fixtures (docs/api/STANDARD-ENDPOINT-CONSUMER-EXAMPLES.md)', () => {
  it('post body UTF-8 bytes match documented bh claim', () => {
    const raw = readFileSync(join(fixturesDir, 'consumer-example-post-body.json'), 'utf8');
    const body = Buffer.from(raw, 'utf8');
    const meta = JSON.parse(
      readFileSync(join(fixturesDir, 'consumer-example-meta.json'), 'utf8') as string
    ) as { bh: string };
    expect(hashRequestBody(body)).toBe(meta.bh);
  });
});
