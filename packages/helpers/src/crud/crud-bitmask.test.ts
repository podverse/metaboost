import { describe, expect, it } from 'vitest';

import { CRUD_BITS, bitmaskToFlags, flagsToBitmask } from './crud-bitmask.js';

describe('crud bitmask helpers', () => {
  it('maps known bitmask values to expected flags', () => {
    expect(bitmaskToFlags(0)).toEqual({
      create: false,
      read: false,
      update: false,
      delete: false,
    });
    expect(bitmaskToFlags(CRUD_BITS.create | CRUD_BITS.read)).toEqual({
      create: true,
      read: true,
      update: false,
      delete: false,
    });
  });

  it('converts flags to bitmask correctly', () => {
    expect(
      flagsToBitmask({
        create: true,
        read: false,
        update: true,
        delete: true,
      })
    ).toBe(CRUD_BITS.create | CRUD_BITS.update | CRUD_BITS.delete);
  });

  it('round-trips representative masks through flagsToBitmask and bitmaskToFlags', () => {
    const samples = [0, 1, 2, 4, 8, 3, 5, 10, 15];
    for (const mask of samples) {
      const flags = bitmaskToFlags(mask);
      const rebuiltMask = flagsToBitmask(flags);
      expect(rebuiltMask).toBe(mask);
    }
  });

  it('ignores unrelated bits when converting to flags', () => {
    const flags = bitmaskToFlags(31);
    expect(flags).toEqual({
      create: true,
      read: true,
      update: true,
      delete: true,
    });
  });
});
