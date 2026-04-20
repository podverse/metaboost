import type { Request, Response } from 'express';

import { BucketBlockedSenderService, BucketService } from '@metaboost/orm';

import { getBucketContext } from '../lib/bucket-context.js';
import { canDeleteMessage } from '../lib/bucket-policy.js';

function toJson(row: {
  id: string;
  rootBucketId: string;
  senderGuid: string;
  labelSnapshot: string | null;
  createdAt: Date;
}): {
  id: string;
  rootBucketId: string;
  senderGuid: string;
  labelSnapshot: string | null;
  createdAt: string;
} {
  return {
    id: row.id,
    rootBucketId: row.rootBucketId,
    senderGuid: row.senderGuid,
    labelSnapshot: row.labelSnapshot,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listBlockedSenders(req: Request, res: Response): Promise<void> {
  const ctx = await getBucketContext(req, res, { paramKey: 'bucketId', can: canDeleteMessage });
  if (ctx === null) {
    return;
  }
  const rootId = await BucketService.resolveRootBucketId(ctx.resolved.bucket.id);
  if (rootId === null) {
    res.status(404).json({ message: 'Bucket not found' });
    return;
  }
  const q = typeof req.query.q === 'string' && req.query.q.trim() !== '' ? req.query.q : undefined;
  const rows = await BucketBlockedSenderService.listForRoot(rootId, q);
  res.status(200).json({ blockedSenders: rows.map((r) => toJson(r)) });
}

export async function addBlockedSender(req: Request, res: Response): Promise<void> {
  const ctx = await getBucketContext(req, res, { paramKey: 'bucketId', can: canDeleteMessage });
  if (ctx === null) {
    return;
  }
  const body = req.body as { senderGuid: string; labelSnapshot?: string | null };
  const rootId = await BucketService.resolveRootBucketId(ctx.resolved.bucket.id);
  if (rootId === null) {
    res.status(404).json({ message: 'Bucket not found' });
    return;
  }
  const label =
    body.labelSnapshot === undefined
      ? null
      : body.labelSnapshot === null || body.labelSnapshot === ''
        ? null
        : body.labelSnapshot;
  const row = await BucketBlockedSenderService.add(rootId, body.senderGuid, label);
  res.status(201).json({ blockedSender: toJson(row) });
}

export async function removeBlockedSender(req: Request, res: Response): Promise<void> {
  const ctx = await getBucketContext(req, res, { paramKey: 'bucketId', can: canDeleteMessage });
  if (ctx === null) {
    return;
  }
  const blockedSenderId = req.params.blockedSenderId as string;
  if (typeof blockedSenderId !== 'string' || blockedSenderId === '') {
    res.status(400).json({ message: 'Invalid id' });
    return;
  }
  const rootId = await BucketService.resolveRootBucketId(ctx.resolved.bucket.id);
  if (rootId === null) {
    res.status(404).json({ message: 'Bucket not found' });
    return;
  }
  const ok = await BucketBlockedSenderService.deleteByIdAndRoot(blockedSenderId, rootId);
  if (!ok) {
    res.status(404).json({ message: 'Not found' });
    return;
  }
  res.status(204).send();
}
