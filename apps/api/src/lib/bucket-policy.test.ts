import type { Bucket, BucketAdmin } from '@metaboost/orm';

import { CRUD_BITS } from '@metaboost/helpers';
import { describe, expect, it } from 'vitest';

import {
  canCreateBucket,
  canCreateMessage,
  canDeleteBucket,
  canDeleteMessage,
  canManageBucketAdmins,
  canManageBucketRoles,
  canReadBucket,
  canReadMessage,
  canUpdateBucket,
  canUpdateMessage,
} from './bucket-policy.js';

function makeBucket(ownerId: string): Bucket {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    shortId: 'bucket01',
    ownerId,
    parentBucketId: null,
    settings: null,
    title: 'Test Bucket',
    description: null,
    iconUrl: null,
    isPublic: false,
    createdAt: new Date(0),
    updatedAt: new Date(0),
  } as unknown as Bucket;
}

function makeBucketAdmin(bucketCrud: number, bucketMessagesCrud: number): BucketAdmin {
  return {
    id: '00000000-0000-4000-8000-000000000010',
    userId: 'admin-user',
    bucketId: '00000000-0000-4000-8000-000000000001',
    bucketCrud,
    bucketMessagesCrud,
    createdAt: new Date(0),
    updatedAt: new Date(0),
  } as unknown as BucketAdmin;
}

describe('bucket policy', () => {
  it('owner has full bucket and message permissions', () => {
    const ownerId = 'owner-user';
    const bucket = makeBucket(ownerId);
    const admin = null;
    expect(canReadBucket(ownerId, bucket, admin)).toBe(true);
    expect(canCreateBucket(ownerId, bucket, admin)).toBe(true);
    expect(canUpdateBucket(ownerId, bucket, admin)).toBe(true);
    expect(canDeleteBucket(ownerId, bucket, admin)).toBe(true);
    expect(canCreateMessage(ownerId, bucket, admin)).toBe(true);
    expect(canUpdateMessage(ownerId, bucket, admin)).toBe(true);
    expect(canDeleteMessage(ownerId, bucket, admin)).toBe(true);
    expect(canManageBucketAdmins(ownerId, bucket, admin)).toBe(true);
    expect(canManageBucketRoles(ownerId, bucket, admin)).toBe(true);
  });

  it('non-owner admin uses bucketCrud bits for bucket-level actions', () => {
    const bucket = makeBucket('owner-user');
    const admin = makeBucketAdmin(CRUD_BITS.read | CRUD_BITS.update, 0);
    const userId = 'admin-user';
    expect(canReadBucket(userId, bucket, admin)).toBe(true);
    expect(canCreateBucket(userId, bucket, admin)).toBe(false);
    expect(canUpdateBucket(userId, bucket, admin)).toBe(true);
    expect(canDeleteBucket(userId, bucket, admin)).toBe(false);
    expect(canManageBucketAdmins(userId, bucket, admin)).toBe(true);
    expect(canManageBucketRoles(userId, bucket, admin)).toBe(true);
  });

  it('non-owner admin uses bucketMessagesCrud bits for message actions', () => {
    const bucket = makeBucket('owner-user');
    const admin = makeBucketAdmin(0, CRUD_BITS.read | CRUD_BITS.create);
    const userId = 'admin-user';
    expect(canReadMessage(userId, bucket, admin, false)).toBe(true);
    expect(canCreateMessage(userId, bucket, admin)).toBe(true);
    expect(canUpdateMessage(userId, bucket, admin)).toBe(false);
    expect(canDeleteMessage(userId, bucket, admin)).toBe(false);
  });

  it('allows anyone to read messages in a public message bucket', () => {
    const bucket = makeBucket('owner-user');
    expect(canReadMessage('non-owner-non-admin', bucket, null, true)).toBe(true);
  });

  it('denies non-owner non-admin when bucket is private', () => {
    const bucket = makeBucket('owner-user');
    const userId = 'non-owner-non-admin';
    expect(canReadBucket(userId, bucket, null)).toBe(false);
    expect(canCreateBucket(userId, bucket, null)).toBe(false);
    expect(canUpdateBucket(userId, bucket, null)).toBe(false);
    expect(canDeleteBucket(userId, bucket, null)).toBe(false);
    expect(canReadMessage(userId, bucket, null, false)).toBe(false);
    expect(canCreateMessage(userId, bucket, null)).toBe(false);
    expect(canUpdateMessage(userId, bucket, null)).toBe(false);
    expect(canDeleteMessage(userId, bucket, null)).toBe(false);
    expect(canManageBucketAdmins(userId, bucket, null)).toBe(false);
    expect(canManageBucketRoles(userId, bucket, null)).toBe(false);
  });
});
