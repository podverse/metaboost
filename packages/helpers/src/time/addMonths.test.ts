import { describe, expect, it } from 'vitest';

import { addMonths } from './addMonths.js';

describe('addMonths', () => {
  it('adds whole months', () => {
    const start = new Date(2024, 0, 15);
    const next = addMonths(start, 3);
    expect(next.getFullYear()).toBe(2024);
    expect(next.getMonth()).toBe(3);
    expect(next.getDate()).toBe(15);
  });
});
