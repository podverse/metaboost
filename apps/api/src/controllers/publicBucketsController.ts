import type { Request, Response } from 'express';

import { BucketService } from '@metaboost/orm';

import { getBucketAndEffective } from '../lib/bucket-effective.js';
import { toPublicBucketResponse } from '../lib/bucket-response.js';

/** Public: get bucket metadata by short_id (only if bucket is public). */
export async function getPublicBucket(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const resolved = await getBucketAndEffective(id);
  if (resolved === null || !resolved.bucket.isPublic) {
    res.status(404).json({ message: 'Bucket not found' });
    return;
  }
  const { bucket } = resolved;
  const ancestry = await BucketService.findAncestry(bucket.id);
  const ancestors = ancestry
    .filter((candidateBucket) => candidateBucket.isPublic)
    .map((candidateBucket) => ({ shortId: candidateBucket.shortId, name: candidateBucket.name }));
  res.status(200).json({ bucket: toPublicBucketResponse(bucket, undefined, ancestors) });
}
