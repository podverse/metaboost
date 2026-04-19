import type { Request, Response } from 'express';

import { GlobalBlockedAppService } from '@metaboost/orm';

import { listRegistryApps } from '../lib/registryApps.js';

export async function listGlobalBlockedApps(_req: Request, res: Response): Promise<void> {
  const [registryApps, globalBlockedRows] = await Promise.all([
    listRegistryApps(),
    GlobalBlockedAppService.listAll(),
  ]);
  const globalByAppId = new Map(globalBlockedRows.map((row) => [row.appId, row]));
  const apps = registryApps.map((registryApp) => {
    const globalRow = globalByAppId.get(registryApp.app_id) ?? null;
    const registryBlocked = registryApp.status === 'suspended' || registryApp.status === 'revoked';
    const globallyBlockedOverride = globalRow !== null;
    const blockedEverywhere = registryBlocked || globallyBlockedOverride;
    return {
      appId: registryApp.app_id,
      displayName: registryApp.display_name,
      status: registryApp.status,
      globallyBlocked: globallyBlockedOverride,
      globalBlockedId: globalRow?.id ?? null,
      globalBlockNote: globalRow?.note ?? null,
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

export async function addGlobalBlockedApp(req: Request, res: Response): Promise<void> {
  const body = req.body as { appId: string; note?: string | null };
  const appId = body.appId.trim();
  const note =
    body.note === undefined
      ? null
      : body.note === null || body.note.trim() === ''
        ? null
        : body.note;
  const row = await GlobalBlockedAppService.addOrUpdate(appId, note);
  res.status(201).json({
    blockedApp: {
      id: row.id,
      appId: row.appId,
      note: row.note,
      createdAt: row.createdAt.toISOString(),
    },
  });
}

export async function removeGlobalBlockedApp(req: Request, res: Response): Promise<void> {
  const appIdRaw = req.params.appId as string;
  const appId = typeof appIdRaw === 'string' ? appIdRaw.trim() : '';
  if (appId === '') {
    res.status(400).json({ message: 'Invalid appId' });
    return;
  }
  const ok = await GlobalBlockedAppService.deleteByAppId(appId);
  if (!ok) {
    res.status(404).json({ message: 'Not found' });
    return;
  }
  res.status(204).send();
}
