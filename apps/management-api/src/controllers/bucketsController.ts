import type {
  CreateBucketBody,
  CreateChildBucketBody,
  UpdateBucketBody,
} from '../schemas/buckets.js';
import type { Bucket } from '@boilerplate/orm';
import type { Request, Response } from 'express';

import {
  DEFAULT_PAGE_LIMIT,
  formatUserLabel,
  MAX_PAGE_SIZE,
  MAX_TOTAL_CAP,
} from '@boilerplate/helpers';
import { BucketMessageService, BucketService, UserService } from '@boilerplate/orm';

import { getBucketResolved } from '../lib/bucket-context.js';
import { bucketToJson } from '../lib/bucketToJson.js';

export async function listBuckets(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(req.query.limit) || DEFAULT_PAGE_LIMIT));
  const searchRaw = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;
  const search = searchRaw === '' ? undefined : searchRaw;
  const sortByRaw = typeof req.query.sortBy === 'string' ? req.query.sortBy.trim() : undefined;
  const sortBy = sortByRaw === '' ? undefined : sortByRaw;
  const sortOrderRaw = req.query.sortOrder;
  const sortOrder = sortOrderRaw === 'asc' || sortOrderRaw === 'desc' ? sortOrderRaw : undefined;
  const offset = (page - 1) * limit;

  const { buckets, total } = await BucketService.listPaginated(
    limit,
    offset,
    search,
    sortBy,
    sortOrder
  );
  const cappedTotal = total > MAX_TOTAL_CAP ? MAX_TOTAL_CAP : total;
  const totalPages = Math.max(1, Math.ceil(cappedTotal / limit));
  const truncatedTotal = total > MAX_TOTAL_CAP;

  res.status(200).json({
    buckets: buckets.map((bucket) => bucketToJson(bucket)),
    total: cappedTotal,
    page,
    limit,
    totalPages,
    ...(truncatedTotal && { truncatedTotal: true }),
  });
}

function formatOwnerDisplayName(owner: {
  credentials?: { email?: string | null; username?: string | null };
  bio?: { displayName?: string | null } | null;
}): string {
  return formatUserLabel({
    username: owner.credentials?.username ?? null,
    email: owner.credentials?.email ?? null,
    displayName: owner.bio?.displayName ?? null,
  });
}

/** Resolve bucket by shortId or UUID. Use for all :id and :bucketId params so URLs can use short IDs. */
export async function resolveBucket(idOrShortId: string): Promise<Bucket | null> {
  const byShortId = await BucketService.findByShortId(idOrShortId);
  if (byShortId !== null) return byShortId;
  return BucketService.findById(idOrShortId);
}

export async function getBucket(req: Request, res: Response): Promise<void> {
  const resolved = await getBucketResolved(req, res);
  if (resolved === null) return;
  const { bucket, effectiveBucket, effectiveSettings } = resolved;
  const owner = await UserService.findById(effectiveBucket.ownerId);
  const ownerDisplayName = owner !== null ? formatOwnerDisplayName(owner) : null;
  const overrides =
    bucket.parentBucketId !== null
      ? {
          ownerId: effectiveBucket.ownerId,
          ownerDisplayName,
          messageBodyMaxLength: effectiveSettings?.messageBodyMaxLength ?? null,
        }
      : undefined;
  res.status(200).json({
    bucket: bucketToJson(bucket, ownerDisplayName, overrides),
  });
}

export async function createBucket(req: Request, res: Response): Promise<void> {
  const body = req.body as CreateBucketBody;
  const owner = await UserService.findById(body.ownerId);
  if (owner === null) {
    res.status(400).json({ message: 'Owner not found' });
    return;
  }
  const bucket = await BucketService.create({
    ownerId: body.ownerId,
    name: body.name,
    isPublic: body.isPublic ?? true,
    parentBucketId: null,
  });
  res.status(201).json({ bucket: bucketToJson(bucket) });
}

export async function updateBucket(req: Request, res: Response): Promise<void> {
  const resolved = await getBucketResolved(req, res);
  if (resolved === null) return;
  const { bucket, effectiveBucket, effectiveSettings, isDescendant } = resolved;
  const body = req.body as UpdateBucketBody;
  if (isDescendant) {
    if (body.isPublic !== undefined || body.messageBodyMaxLength !== undefined) {
      res.status(400).json({
        message:
          'Descendant buckets inherit settings from the root bucket; only name can be updated.',
      });
      return;
    }
    await BucketService.update(bucket.id, { name: body.name });
  } else {
    await BucketService.update(bucket.id, {
      name: body.name,
      isPublic: body.isPublic,
      messageBodyMaxLength: body.messageBodyMaxLength,
    });
  }
  const updated = await BucketService.findById(bucket.id);
  if (updated === null) {
    res.status(404).json({ message: 'Bucket not found' });
    return;
  }
  const overrides =
    updated.parentBucketId !== null
      ? {
          ownerId: effectiveBucket.ownerId,
          messageBodyMaxLength: effectiveSettings?.messageBodyMaxLength ?? null,
        }
      : undefined;
  const owner = await UserService.findById(effectiveBucket.ownerId);
  const ownerDisplayName = owner !== null ? formatOwnerDisplayName(owner) : null;
  res.status(200).json({
    bucket: bucketToJson(updated, ownerDisplayName, overrides),
  });
}

export async function deleteBucket(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const bucket = await resolveBucket(id);
  if (bucket === null) {
    res.status(404).json({ message: 'Bucket not found' });
    return;
  }
  await BucketService.delete(bucket.id);
  res.status(204).send();
}

/** List child buckets for a bucket. GET /buckets/:id/buckets. Uses effective root for inherited overrides. */
export async function listChildBuckets(req: Request, res: Response): Promise<void> {
  const resolved = await getBucketResolved(req, res);
  if (resolved === null) return;
  const { bucket: parent, effectiveBucket, effectiveSettings } = resolved;
  const owner = await UserService.findById(effectiveBucket.ownerId);
  const ownerDisplayName = owner !== null ? formatOwnerDisplayName(owner) : null;
  const messageBodyMaxLength = effectiveSettings?.messageBodyMaxLength ?? null;
  const children = await BucketService.findChildren(parent.id);
  const lastMessageAtMap = await BucketMessageService.getLatestMessageCreatedAtByBucketIds(
    children.map((b) => b.id)
  );
  const overrides = {
    ownerId: effectiveBucket.ownerId,
    ownerDisplayName,
    messageBodyMaxLength,
  };
  res.status(200).json({
    buckets: children.map((b) =>
      bucketToJson(b, ownerDisplayName, {
        ...overrides,
        lastMessageAt: lastMessageAtMap.get(b.id)?.toISOString() ?? null,
      })
    ),
  });
}

/** Create a child bucket under the given parent. POST /buckets/:id/buckets. */
export async function createChildBucket(req: Request, res: Response): Promise<void> {
  const resolved = await getBucketResolved(req, res);
  if (resolved === null) return;
  const { bucket: parent, effectiveBucket, effectiveSettings } = resolved;
  const body = req.body as CreateChildBucketBody;
  const childBucket = await BucketService.create({
    ownerId: effectiveBucket.ownerId,
    name: body.name,
    isPublic: body.isPublic ?? true,
    parentBucketId: parent.id,
  });
  const overrides = {
    messageBodyMaxLength: effectiveSettings?.messageBodyMaxLength ?? null,
    ownerId: effectiveBucket.ownerId,
  };
  const owner = await UserService.findById(effectiveBucket.ownerId);
  const ownerDisplayName = owner !== null ? formatOwnerDisplayName(owner) : null;
  res.status(201).json({
    bucket: bucketToJson(childBucket, ownerDisplayName, overrides),
  });
}
