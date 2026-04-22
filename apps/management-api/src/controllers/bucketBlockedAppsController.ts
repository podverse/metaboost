import type { Request, Response } from 'express';

import { BucketBlockedAppService, BucketService, GlobalBlockedAppService } from '@metaboost/orm';

import { listRegistryApps } from '../lib/registryApps.js';
import { resolveBucket } from './bucketsController.js';

function toJson(row: {
  id: string;
  rootBucketId: string;
  appId: string;
  appNameSnapshot: string | null;
  createdAt: Date;
}): {
  id: string;
  rootBucketId: string;
  appId: string;
  appNameSnapshot: string | null;
  createdAt: string;
} {
  return {
    id: row.id,
    rootBucketId: row.rootBucketId,
    appId: row.appId,
    appNameSnapshot: row.appNameSnapshot,
    createdAt: row.createdAt.toISOString(),
  };
}

function bucketIdParam(req: Request): string {
  return req.params.id as string;
}

export async function listRegistryAppsForBucket(req: Request, res: Response): Promise<void> {
  const bucket = await resolveBucket(bucketIdParam(req));
  if (bucket === null) {
    res.status(404).json({ message: 'Bucket not found' });
    return;
  }
  const rootId = await BucketService.resolveRootBucketId(bucket.id);
  if (rootId === null) {
    res.status(404).json({ message: 'Bucket not found' });
    return;
  }
  const listed = await listRegistryApps();
  const [blockedRows, globalAppIds] = await Promise.all([
    BucketBlockedAppService.listForRoot(rootId),
    GlobalBlockedAppService.listAppIds(),
  ]);
  const blockedByAppId = new Map(blockedRows.map((row) => [row.appId, row]));
  const globalBlockedSet = new Set(globalAppIds);

  const apps = listed.map((record) => {
    const bucketBlockedRow = blockedByAppId.get(record.app_id) ?? null;
    const registryBlocked = record.status === 'suspended' || record.status === 'revoked';
    const globallyBlockedOverride = globalBlockedSet.has(record.app_id);
    const blockedEverywhere = registryBlocked || globallyBlockedOverride;
    return {
      appId: record.app_id,
      displayName: record.display_name,
      status: record.status,
      bucketBlocked: bucketBlockedRow !== null,
      bucketBlockedId: bucketBlockedRow?.id ?? null,
      globallyBlocked: globallyBlockedOverride,
      blockedEverywhere,
      blockedEverywhereReason: registryBlocked
        ? 'registry'
        : globallyBlockedOverride
          ? 'global_override'
          : null,
    };
  });
  res.status(200).json({ apps });
}

export async function listBlockedApps(req: Request, res: Response): Promise<void> {
  const bucket = await resolveBucket(bucketIdParam(req));
  if (bucket === null) {
    res.status(404).json({ message: 'Bucket not found' });
    return;
  }
  const rootId = await BucketService.resolveRootBucketId(bucket.id);
  if (rootId === null) {
    res.status(404).json({ message: 'Bucket not found' });
    return;
  }
  const q = typeof req.query.q === 'string' && req.query.q.trim() !== '' ? req.query.q : undefined;
  const rows = await BucketBlockedAppService.listForRoot(rootId, q);
  res.status(200).json({ blockedApps: rows.map((r) => toJson(r)) });
}

export async function addBlockedApp(req: Request, res: Response): Promise<void> {
  const bucket = await resolveBucket(bucketIdParam(req));
  if (bucket === null) {
    res.status(404).json({ message: 'Bucket not found' });
    return;
  }
  const body = req.body as { appId: string; appNameSnapshot?: string | null };
  const rootId = await BucketService.resolveRootBucketId(bucket.id);
  if (rootId === null) {
    res.status(404).json({ message: 'Bucket not found' });
    return;
  }
  const appId = body.appId.trim();
  const label =
    body.appNameSnapshot === undefined
      ? null
      : body.appNameSnapshot === null || body.appNameSnapshot === ''
        ? null
        : body.appNameSnapshot;
  const row = await BucketBlockedAppService.add(rootId, appId, label);
  res.status(201).json({ blockedApp: toJson(row) });
}

export async function removeBlockedApp(req: Request, res: Response): Promise<void> {
  const bucket = await resolveBucket(bucketIdParam(req));
  if (bucket === null) {
    res.status(404).json({ message: 'Bucket not found' });
    return;
  }
  const blockedAppId = req.params.blockedAppId as string;
  if (typeof blockedAppId !== 'string' || blockedAppId === '') {
    res.status(400).json({ message: 'Invalid id' });
    return;
  }
  const rootId = await BucketService.resolveRootBucketId(bucket.id);
  if (rootId === null) {
    res.status(404).json({ message: 'Bucket not found' });
    return;
  }
  const ok = await BucketBlockedAppService.deleteByIdAndRoot(blockedAppId, rootId);
  if (!ok) {
    res.status(404).json({ message: 'Not found' });
    return;
  }
  res.status(204).send();
}
