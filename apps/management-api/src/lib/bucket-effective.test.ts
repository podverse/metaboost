import type { Bucket } from '@metaboost/orm';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BucketService } from '@metaboost/orm';

import { getBucketAndEffective } from './bucket-effective.js';

vi.mock('@metaboost/orm', () => ({
  BucketService: {
    findByIdText: vi.fn(),
    findById: vi.fn(),
  },
}));

function makeBucket(input: {
  id: string;
  idText: string;
  ownerId: string;
  parentBucketId: string | null;
  settings?: Bucket['settings'];
}): Bucket {
  return {
    id: input.id,
    idText: input.idText,
    ownerId: input.ownerId,
    parentBucketId: input.parentBucketId,
    settings: input.settings ?? null,
    title: 'Bucket',
    description: null,
    iconUrl: null,
    isPublic: false,
    createdAt: new Date(0),
    updatedAt: new Date(0),
  } as unknown as Bucket;
}

describe('management getBucketAndEffective', () => {
  const findByIdText = vi.mocked(BucketService.findByIdText);
  const findById = vi.mocked(BucketService.findById);

  beforeEach(() => {
    findByIdText.mockReset();
    findById.mockReset();
  });

  it('falls back to id lookup when idText is not found', async () => {
    const root = makeBucket({
      id: '66666666-6666-4666-8666-666666666666',
      idText: 'root03',
      ownerId: 'owner-user',
      parentBucketId: null,
      settings: { allowBoostMessages: false } as unknown as Bucket['settings'],
    });
    findByIdText.mockResolvedValue(null);
    findById.mockResolvedValue(root);

    const result = await getBucketAndEffective('66666666-6666-4666-8666-666666666666');
    expect(result).not.toBeNull();
    expect(result?.effectiveBucket.id).toBe(root.id);
    expect(result?.isDescendant).toBe(false);
  });

  it('resolves descendant effective root from parent chain', async () => {
    const child = makeBucket({
      id: '77777777-7777-4777-8777-777777777777',
      idText: 'child03',
      ownerId: 'owner-user',
      parentBucketId: '88888888-8888-4888-8888-888888888888',
    });
    const root = makeBucket({
      id: '88888888-8888-4888-8888-888888888888',
      idText: 'root04',
      ownerId: 'owner-user',
      parentBucketId: null,
    });
    findByIdText.mockResolvedValue(child);
    findById.mockResolvedValue(root);

    const result = await getBucketAndEffective('child03');
    expect(result).not.toBeNull();
    expect(result?.bucket.id).toBe(child.id);
    expect(result?.effectiveBucket.id).toBe(root.id);
    expect(result?.isDescendant).toBe(true);
  });

  it('returns null when bucket cannot be found by idText or id', async () => {
    findByIdText.mockResolvedValue(null);
    findById.mockResolvedValue(null);

    const result = await getBucketAndEffective('missing-bucket');
    expect(result).toBeNull();
  });

  it('returns null when UUID-shaped id resolves via neither idText nor id lookup', async () => {
    const uuid = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    findByIdText.mockResolvedValue(null);
    findById.mockResolvedValue(null);

    const result = await getBucketAndEffective(uuid);
    expect(result).toBeNull();
  });
});
