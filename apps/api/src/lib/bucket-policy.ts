import type { Bucket } from '@metaboost/orm';
import type { BucketAdmin } from '@metaboost/orm';
import type { BucketMessage } from '@metaboost/orm';

import { CRUD_BITS } from '@metaboost/helpers';

/**
 * Bucket permission policy: owner has full CRUD; bucket admins have access per
 * bucket_crud and bucket_messages_crud bitmasks (create=1, read=2, update=4, delete=8).
 * Pass null for bucketAdmin when the user is not an admin for the bucket.
 */

type CanBucketCrudFn = (userId: string, bucket: Bucket, bucketAdmin: BucketAdmin | null) => boolean;

type CanMessageCrudFn = (
  userId: string,
  bucket: Bucket,
  bucketAdmin: BucketAdmin | null,
  _message?: BucketMessage
) => boolean;

function makeCanBucketCrud(bit: number): CanBucketCrudFn {
  return (userId, bucket, bucketAdmin) => {
    if (bucket.ownerId === userId) return true;
    if (bucketAdmin !== null) return (bucketAdmin.bucketCrud & bit) !== 0;
    return false;
  };
}

function makeCanMessageCrud(bit: number): CanMessageCrudFn {
  return (userId, bucket, bucketAdmin) => {
    if (bucket.ownerId === userId) return true;
    if (bucketAdmin !== null) return (bucketAdmin.bucketMessagesCrud & bit) !== 0;
    return false;
  };
}

export const canReadBucket = makeCanBucketCrud(CRUD_BITS.read);

/** Can create a child bucket under this bucket. Owner can; admin with create can. */
export const canCreateBucket = makeCanBucketCrud(CRUD_BITS.create);

export const canUpdateBucket = makeCanBucketCrud(CRUD_BITS.update);

export const canDeleteBucket = makeCanBucketCrud(CRUD_BITS.delete);

export function canReadMessage(
  userId: string,
  bucket: Bucket,
  bucketAdmin: BucketAdmin | null,
  message: BucketMessage
): boolean {
  if (message.isPublic) return true;
  if (bucket.ownerId === userId) return true;
  if (bucketAdmin !== null) return (bucketAdmin.bucketMessagesCrud & CRUD_BITS.read) !== 0;
  return false;
}

export const canCreateMessage = makeCanMessageCrud(CRUD_BITS.create);

export const canUpdateMessage = makeCanMessageCrud(CRUD_BITS.update);

export const canDeleteMessage = makeCanMessageCrud(CRUD_BITS.delete);

/** Owner can manage admins; bucket admin can if they have update on bucket. */
export const canManageBucketAdmins = makeCanBucketCrud(CRUD_BITS.update);

/** Owner can manage roles; bucket admin can if they have update on bucket. */
export const canManageBucketRoles = makeCanBucketCrud(CRUD_BITS.update);
