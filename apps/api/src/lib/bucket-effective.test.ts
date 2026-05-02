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

function makeBucketSettings(bucketId: string): NonNullable<Bucket['settings']> {
  return {
    bucketId,
    messageBodyMaxLength: 500,
    preferredCurrency: 'USD',
    publicBoostDisplayMinimumMinor: 0,
    bucket: {} as Bucket,
  };
}

describe('api getBucketAndEffective', () => {
  const findByIdText = vi.mocked(BucketService.findByIdText);
  const findById = vi.mocked(BucketService.findById);

  beforeEach(() => {
    findByIdText.mockReset();
    findById.mockReset();
  });

  it('resolves by idText and returns root as effective bucket for descendants', async () => {
    const child = makeBucket({
      id: '11111111-1111-4111-8111-111111111111',
      idText: 'child01',
      ownerId: 'owner-user',
      parentBucketId: '22222222-2222-4222-8222-222222222222',
    });
    const root = makeBucket({
      id: '22222222-2222-4222-8222-222222222222',
      idText: 'root01',
      ownerId: 'owner-user',
      parentBucketId: null,
      settings: makeBucketSettings('22222222-2222-4222-8222-222222222222'),
    });
    findByIdText.mockResolvedValue(child);
    findById.mockResolvedValue(root);

    const result = await getBucketAndEffective('child01');
    expect(result).not.toBeNull();
    expect(result?.bucket.id).toBe(child.id);
    expect(result?.effectiveBucket.id).toBe(root.id);
    expect(result?.isDescendant).toBe(true);
    expect(result?.effectiveSettings).toEqual(root.settings);
  });

  it('returns null early for invalid UUID when idText lookup misses', async () => {
    findByIdText.mockResolvedValue(null);

    const result = await getBucketAndEffective('not-a-uuid');
    expect(result).toBeNull();
    expect(findById).not.toHaveBeenCalled();
  });

  it('resolves by UUID id when idText lookup misses', async () => {
    const root = makeBucket({
      id: '33333333-3333-4333-8333-333333333333',
      idText: 'root02',
      ownerId: 'owner-user',
      parentBucketId: null,
    });
    findByIdText.mockResolvedValue(null);
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
      idText: 'child02',
      ownerId: 'owner-user',
      parentBucketId: '55555555-5555-4555-8555-555555555555',
    });
    findByIdText.mockResolvedValue(child);
    findById.mockResolvedValue(null);

    const result = await getBucketAndEffective('child02');
    expect(result).toBeNull();
  });

  it('returns null when UUID path misses (idText null and findById null)', async () => {
    const uuid = 'aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee';
    findByIdText.mockResolvedValue(null);
    findById.mockResolvedValue(null);

    const result = await getBucketAndEffective(uuid);
    expect(result).toBeNull();
  });
});
