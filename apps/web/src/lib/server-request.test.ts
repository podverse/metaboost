import { describe, expect, it } from 'vitest';

import { parseFilterColumns } from './server-request';

describe('parseFilterColumns (delegates to helpers)', () => {
  const valid = ['colA', 'colB', 'colC'];

  it('returns all column ids when filterColumns is empty', () => {
    expect(parseFilterColumns({}, valid)).toEqual(valid);
    expect(parseFilterColumns({ filterColumns: '' }, valid)).toEqual(valid);
    expect(parseFilterColumns({ filterColumns: '   ' }, valid)).toEqual(valid);
  });

  it('filters to allowed ids only', () => {
    expect(parseFilterColumns({ filterColumns: 'colA,nope,colB' }, valid)).toEqual([
      'colA',
      'colB',
    ]);
  });

  it('falls back to all ids when parsed list is empty', () => {
    expect(parseFilterColumns({ filterColumns: 'bad,bad2' }, valid)).toEqual(valid);
  });
});
