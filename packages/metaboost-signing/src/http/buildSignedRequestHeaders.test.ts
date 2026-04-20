import { describe, expect, it } from 'vitest';

import { buildSignedRequestHeaders } from './buildSignedRequestHeaders.js';

describe('buildSignedRequestHeaders', () => {
  it('builds Authorization AppAssertion header', () => {
    const h = buildSignedRequestHeaders({ jwt: 'abc.def.ghi' });
    expect(h.Authorization).toBe('AppAssertion abc.def.ghi');
  });

  it('rejects empty jwt', () => {
    expect(() => buildSignedRequestHeaders({ jwt: '   ' })).toThrow(/non-empty/);
  });
});
