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

  it('clamps Jan 31 to last day of February in a leap year', () => {
    const start = new Date(2024, 0, 31);
    const next = addMonths(start, 1);
    expect(next.getFullYear()).toBe(2024);
    expect(next.getMonth()).toBe(1);
    expect(next.getDate()).toBe(29);
  });

  it('clamps Mar 31 to Apr 30', () => {
    const start = new Date(2026, 2, 31);
    const next = addMonths(start, 1);
    expect(next.getFullYear()).toBe(2026);
    expect(next.getMonth()).toBe(3);
    expect(next.getDate()).toBe(30);
  });
});
