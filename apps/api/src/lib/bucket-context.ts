import type { BucketAndEffective } from './bucket-effective.js';
import type { Bucket } from '@metaboost/orm';
import type { Request, Response } from 'express';

import { BucketAdminService } from '@metaboost/orm';

import { getBucketAndEffective } from './bucket-effective.js';

export type BucketPermissionFn = (
  userId: string,
  bucket: Bucket,
  bucketAdmin: Awaited<ReturnType<typeof BucketAdminService.findByBucketAndUser>> | null
) => boolean;

export type GetBucketContextOptions = {
  /** Which route param holds the bucket id or shortId. */
  paramKey: 'bucketId' | 'id';
  /** Permission predicate; 403 if false. */
  can: BucketPermissionFn;
  /** When true, send 400 if bucket is a descendant (root-only operations). */
  requireRoot?: boolean;
  /** Message for 400 when requireRoot and isDescendant. If omitted, a generic message is used. */
  requireRootMessage?: string;
};

export type BucketContext = {
  user: NonNullable<Request['user']>;
  resolved: BucketAndEffective;
  bucketAdmin: Awaited<ReturnType<typeof BucketAdminService.findByBucketAndUser>> | null;
};

const DEFAULT_ROOT_MESSAGE = 'Managed on the root bucket only.';

/**
 * Resolve bucket from params, load bucket admin, check permission (and optionally root-only).
 * Sends 401/404/403/400 and returns null on failure; otherwise returns { resolved, bucketAdmin }.
 * Use at the start of bucket-scoped handlers so they can assume context is valid.
 */
export async function getBucketContext(
  req: Request,
  res: Response,
  options: GetBucketContextOptions
): Promise<BucketContext | null> {
  const { paramKey, can, requireRoot = false, requireRootMessage = DEFAULT_ROOT_MESSAGE } = options;

  const user = req.user;
  if (user === undefined) {
    res.status(401).json({ message: 'Authentication required' });
    return null;
  }

  const bucketId = req.params[paramKey];
  if (typeof bucketId !== 'string' || bucketId.trim() === '') {
    res.status(404).json({ message: 'Bucket not found' });
    return null;
  }

  const resolved = await getBucketAndEffective(bucketId);
  if (resolved === null) {
    res.status(404).json({ message: 'Bucket not found' });
    return null;
  }

  const bucketAdmin = await BucketAdminService.findByBucketAndUser(
    resolved.effectiveBucket.id,
    user.id
  );
  if (!can(user.id, resolved.effectiveBucket, bucketAdmin)) {
    res.status(403).json({ message: 'Forbidden' });
    return null;
  }

  if (requireRoot && resolved.isDescendant) {
    res.status(400).json({ message: requireRootMessage });
    return null;
  }

  return { user, resolved, bucketAdmin };
}
