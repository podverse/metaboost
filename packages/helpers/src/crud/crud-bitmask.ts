/** Bitmask bit positions for CRUD permissions. */
export const CRUD_BITS = {
  create: 1,
  read: 2,
  update: 4,
  delete: 8,
} as const;

export type CrudBit = keyof typeof CRUD_BITS;

export function bitmaskToFlags(mask: number): Record<CrudBit, boolean> {
  return {
    create: (mask & CRUD_BITS.create) !== 0,
    read: (mask & CRUD_BITS.read) !== 0,
    update: (mask & CRUD_BITS.update) !== 0,
    delete: (mask & CRUD_BITS.delete) !== 0,
  };
}

export function flagsToBitmask(flags: Record<CrudBit, boolean>): number {
  return (
    (flags.create ? CRUD_BITS.create : 0) |
    (flags.read ? CRUD_BITS.read : 0) |
    (flags.update ? CRUD_BITS.update : 0) |
    (flags.delete ? CRUD_BITS.delete : 0)
  );
}
