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

function makeBucketSettings(bucketId: string): NonNullable<Bucket['settings']> {
  return {
    bucketId,
    messageBodyMaxLength: 500,
    preferredCurrency: 'USD',
    minimumMessageAmountMinor: 0,
    bucket: {} as Bucket,
  };
}

describe('api getBucketAndEffective', () => {
  const findByShortId = vi.mocked(BucketService.findByShortId);
  const findById = vi.mocked(BucketService.findById);

  beforeEach(() => {
    findByShortId.mockReset();
    findById.mockReset();
  });

  it('resolves by shortId and returns root as effective bucket for descendants', async () => {
    const child = makeBucket({
      id: '11111111-1111-4111-8111-111111111111',
      shortId: 'child01',
      ownerId: 'owner-user',
      parentBucketId: '22222222-2222-4222-8222-222222222222',
    });
    const root = makeBucket({
      id: '22222222-2222-4222-8222-222222222222',
      shortId: 'root01',
      ownerId: 'owner-user',
      parentBucketId: null,
      settings: makeBucketSettings('22222222-2222-4222-8222-222222222222'),
    });
    findByShortId.mockResolvedValue(child);
    findById.mockResolvedValue(root);

    const result = await getBucketAndEffective('child01');
    expect(result).not.toBeNull();
    expect(result?.bucket.id).toBe(child.id);
    expect(result?.effectiveBucket.id).toBe(root.id);
    expect(result?.isDescendant).toBe(true);
    expect(result?.effectiveSettings).toEqual(root.settings);
  });

  it('returns null early for invalid UUID when shortId lookup misses', async () => {
    findByShortId.mockResolvedValue(null);

    const result = await getBucketAndEffective('not-a-uuid');
    expect(result).toBeNull();
    expect(findById).not.toHaveBeenCalled();
  });

  it('resolves by UUID id when shortId lookup misses', async () => {
    const root = makeBucket({
      id: '33333333-3333-4333-8333-333333333333',
      shortId: 'root02',
      ownerId: 'owner-user',
      parentBucketId: null,
    });
    findByShortId.mockResolvedValue(null);
    findById.mockResolvedValue(root);

    const result = await getBucketAndEffective('33333333-3333-4333-8333-333333333333');
    expect(result).not.toBeNull();
    expect(result?.bucket.id).toBe(root.id);
    expect(result?.effectiveBucket.id).toBe(root.id);
    expect(result?.isDescendant).toBe(false);
  });

  it('returns null when parent chain cannot be fully resolved', async () => {
    const child = makeBucket({
      id: '44444444-4444-4444-8444-444444444444',
      shortId: 'child02',
      ownerId: 'owner-user',
      parentBucketId: '55555555-5555-4555-8555-555555555555',
    });
    findByShortId.mockResolvedValue(child);
    findById.mockResolvedValue(null);

    const result = await getBucketAndEffective('child02');
    expect(result).toBeNull();
  });

  it('returns null when UUID path misses (shortId null and findById null)', async () => {
    const uuid = 'aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee';
    findByShortId.mockResolvedValue(null);
    findById.mockResolvedValue(null);

    const result = await getBucketAndEffective(uuid);
    expect(result).toBeNull();
  });
});
