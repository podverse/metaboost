import type { BucketAndEffective } from './bucket-effective.js';
import type { Request, Response } from 'express';

import { getBucketAndEffective } from './bucket-effective.js';

export type GetBucketResolvedOptions = {
  /** Which route param holds the bucket id or idText. Default 'id'. */
  paramKey?: 'id' | 'bucketId';
  /** When true, send 400 if bucket is a descendant (root-only operations). */
  requireRoot?: boolean;
  /** Message for 400 when requireRoot and isDescendant. Required when requireRoot is true. */
  requireRootMessage?: string;
};

/**
 * Resolve bucket from request param via getBucketAndEffective. Sends 404 if not found,
 * optional 400 when requireRoot and bucket is a descendant; otherwise returns BucketAndEffective.
 * Does not perform auth or permission checks (handled by middleware).
 */
export async function getBucketResolved(
  req: Request,
  res: Response,
  options: GetBucketResolvedOptions = {}
): Promise<BucketAndEffective | null> {
  const { paramKey = 'id', requireRoot = false, requireRootMessage } = options;

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

  if (requireRoot && resolved.isDescendant) {
    res.status(400).json({
      message: requireRootMessage ?? 'Managed on the root bucket only.',
    });
    return null;
  }

  return resolved;
}
