import 'server-only';

import type { ServerUser } from './server-auth';

import { CRUD_BITS } from '@boilerplate/helpers';
import { request } from '@boilerplate/helpers-requests';

import { getCookieHeader, getServerApiBaseUrl } from './server-request';

type BucketAdminRow = {
  bucketCrud: number;
  bucketMessagesCrud: number;
  bucketAdminsCrud?: number;
};

type BucketAdminResponse = {
  admin?: BucketAdminRow;
};

type BucketViewerAccess = {
  isOwner: boolean;
  bucketCrud: number;
  bucketMessagesCrud: number;
  bucketAdminsCrud: number;
};

const FULL_CRUD = CRUD_BITS.create | CRUD_BITS.read | CRUD_BITS.update | CRUD_BITS.delete;

const hasCrudBit = (crudMask: number, bit: number): boolean => {
  return (crudMask & bit) === bit;
};

const normalizeCrud = (value: number | undefined): number => {
  return typeof value === 'number' ? value : CRUD_BITS.read;
};

async function fetchViewerBucketAdmin(
  bucketId: string,
  user: ServerUser
): Promise<BucketAdminRow | null> {
  const candidateIds = user.shortId === user.id ? [user.id] : [user.shortId, user.id];
  const cookieHeader = await getCookieHeader();
  const baseUrl = getServerApiBaseUrl();

  for (const userId of candidateIds) {
    const res = await request(baseUrl, `/buckets/${bucketId}/admins/${userId}`, {
      headers: { Cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!res.ok || res.data === undefined) {
      continue;
    }

    const data = res.data as BucketAdminResponse;
    const bucketAdmin = data.admin;
    if (
      bucketAdmin !== undefined &&
      typeof bucketAdmin.bucketCrud === 'number' &&
      typeof bucketAdmin.bucketMessagesCrud === 'number'
    ) {
      return bucketAdmin;
    }
  }

  return null;
}

async function getBucketViewerAccess(
  bucketId: string,
  bucketOwnerId: string,
  user: ServerUser
): Promise<BucketViewerAccess | null> {
  if (user.id === bucketOwnerId) {
    return {
      isOwner: true,
      bucketCrud: FULL_CRUD,
      bucketMessagesCrud: FULL_CRUD,
      bucketAdminsCrud: FULL_CRUD,
    };
  }

  const bucketAdmin = await fetchViewerBucketAdmin(bucketId, user);
  if (bucketAdmin === null) {
    return null;
  }

  return {
    isOwner: false,
    bucketCrud: normalizeCrud(bucketAdmin.bucketCrud),
    bucketMessagesCrud: normalizeCrud(bucketAdmin.bucketMessagesCrud),
    bucketAdminsCrud: normalizeCrud(bucketAdmin.bucketAdminsCrud),
  };
}

/**
 * Returns true if the user has the given CRUD bit on the bucket (owner or bucket admin).
 * Aligns with apps/api bucket-policy canUpdateBucket / canCreateBucket checks.
 */
async function checkBucketCrud(
  bucketId: string,
  bucketOwnerId: string,
  user: ServerUser,
  bit: number
): Promise<boolean> {
  const access = await getBucketViewerAccess(bucketId, bucketOwnerId, user);
  if (access === null) return false;
  return access.isOwner || hasCrudBit(access.bucketCrud, bit);
}

/**
 * Returns true if the user has the given CRUD bit on bucket messages (owner or bucket admin).
 * Aligns with apps/api bucket-policy canUpdateMessage check.
 */
async function checkBucketMessagesCrud(
  bucketId: string,
  bucketOwnerId: string,
  user: ServerUser,
  bit: number
): Promise<boolean> {
  const access = await getBucketViewerAccess(bucketId, bucketOwnerId, user);
  if (access === null) return false;
  return access.isOwner || hasCrudBit(access.bucketMessagesCrud, bit);
}

export async function canViewBucketSettings(
  bucketId: string,
  bucketOwnerId: string,
  user: ServerUser
): Promise<boolean> {
  return checkBucketCrud(bucketId, bucketOwnerId, user, CRUD_BITS.update);
}

export async function canCreateBucketRoles(
  bucketId: string,
  bucketOwnerId: string,
  user: ServerUser
): Promise<boolean> {
  return checkBucketCrud(bucketId, bucketOwnerId, user, CRUD_BITS.update);
}

export async function canCreateChildBuckets(
  bucketId: string,
  bucketOwnerId: string,
  user: ServerUser
): Promise<boolean> {
  return checkBucketCrud(bucketId, bucketOwnerId, user, CRUD_BITS.create);
}

/** Only the bucket owner can edit roles (create is gated by bucket update; edit is owner-only). */
export async function canEditBucketRoles(
  bucketId: string,
  bucketOwnerId: string,
  user: ServerUser
): Promise<boolean> {
  const access = await getBucketViewerAccess(bucketId, bucketOwnerId, user);
  if (access === null) return false;
  return access.isOwner;
}

export async function canEditBucketMessages(
  bucketId: string,
  bucketOwnerId: string,
  user: ServerUser
): Promise<boolean> {
  return checkBucketMessagesCrud(bucketId, bucketOwnerId, user, CRUD_BITS.update);
}
