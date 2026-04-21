import type { Bucket } from '@metaboost/orm';

import { BucketService } from '@metaboost/orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getBucketAndEffective } from './bucket-effective.js';

vi.mock('@metaboost/orm', () => ({
  BucketService: {
    findByShortId: vi.fn(),
    findById: vi.fn(),
  },
}));

function makeBucket(input: {
  id: string;
  shortId: string;
  ownerId: string;
  parentBucketId: string | null;
  settings?: Bucket['settings'];
}): Bucket {
  return {
    id: input.id,
    shortId: input.shortId,
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
  const findByShortId = vi.mocked(BucketService.findByShortId);
  const findById = vi.mocked(BucketService.findById);

  beforeEach(() => {
    findByShortId.mockReset();
    findById.mockReset();
  });

  it('falls back to id lookup when shortId is not found', async () => {
    const root = makeBucket({
      id: '66666666-6666-4666-8666-666666666666',
      shortId: 'root03',
      ownerId: 'owner-user',
      parentBucketId: null,
      settings: { allowBoostMessages: false } as Bucket['settings'],
    });
    findByShortId.mockResolvedValue(null);
    findById.mockResolvedValue(root);

    const result = await getBucketAndEffective('66666666-6666-4666-8666-666666666666');
    expect(result).not.toBeNull();
    expect(result?.effectiveBucket.id).toBe(root.id);
    expect(result?.isDescendant).toBe(false);
  });

  it('resolves descendant effective root from parent chain', async () => {
    const child = makeBucket({
      id: '77777777-7777-4777-8777-777777777777',
      shortId: 'child03',
      ownerId: 'owner-user',
      parentBucketId: '88888888-8888-4888-8888-888888888888',
    });
    const root = makeBucket({
      id: '88888888-8888-4888-8888-888888888888',
      shortId: 'root04',
      ownerId: 'owner-user',
      parentBucketId: null,
    });
    findByShortId.mockResolvedValue(child);
    findById.mockResolvedValue(root);

    const result = await getBucketAndEffective('child03');
    expect(result).not.toBeNull();
    expect(result?.bucket.id).toBe(child.id);
    expect(result?.effectiveBucket.id).toBe(root.id);
    expect(result?.isDescendant).toBe(true);
  });

  it('returns null when bucket cannot be found by shortId or id', async () => {
    findByShortId.mockResolvedValue(null);
    findById.mockResolvedValue(null);

    const result = await getBucketAndEffective('missing-bucket');
    expect(result).toBeNull();
  });

  it('returns null when UUID-shaped id resolves via neither shortId nor id lookup', async () => {
    const uuid = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    findByShortId.mockResolvedValue(null);
    findById.mockResolvedValue(null);

    const result = await getBucketAndEffective(uuid);
    expect(result).toBeNull();
  });
});
