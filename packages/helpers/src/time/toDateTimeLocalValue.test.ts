import { describe, expect, it } from 'vitest';

import { toDateTimeLocalValue } from './toDateTimeLocalValue.js';

describe('toDateTimeLocalValue', () => {
  it('returns empty string for null and undefined', () => {
    expect(toDateTimeLocalValue(null)).toBe('');
    expect(toDateTimeLocalValue(undefined)).toBe('');
  });

  it('returns empty string for invalid date input', () => {
    expect(toDateTimeLocalValue('not-a-date')).toBe('');
  });

  it('formats a local-constructed Date using local calendar fields', () => {
    const d = new Date(2020, 6, 8, 9, 7);
    expect(toDateTimeLocalValue(d)).toBe('2020-07-08T09:07');
  });

  it('formats numeric timestamps', () => {
    const d = new Date(2021, 0, 2, 3, 4);
    expect(toDateTimeLocalValue(d.getTime())).toBe('2021-01-02T03:04');
  });

  it('matches formatting from Date from the same parseable string', () => {
    const s = '2020-06-15T14:30:00';
    expect(toDateTimeLocalValue(s)).toBe(toDateTimeLocalValue(new Date(s)));
  });
});
