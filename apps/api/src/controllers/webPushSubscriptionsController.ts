import type {
  UpsertWebPushSubscriptionBody,
  UpdateWebPushSubscriptionBody,
} from '../schemas/webPushSubscriptions.js';
import type { WebPushSubscriptionDto } from '@metaboost/helpers-requests';
import type { UserWebPushSubscription } from '@metaboost/orm';
import type { Request, Response } from 'express';

import { UserWebPushSubscriptionService } from '@metaboost/orm';

import { requireUser } from '../middleware/auth.js';

function subscriptionToJson(row: UserWebPushSubscription): WebPushSubscriptionDto {
  return {
    id: row.id,
    endpoint: row.endpoint,
    locale: row.locale,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listWebPushSubscriptions(req: Request, res: Response): Promise<void> {
  const user = requireUser(req, res);
  if (user === null) {
    return;
  }
  const rows = await UserWebPushSubscriptionService.listByUser(user.id);
  res.status(200).json({ subscriptions: rows.map(subscriptionToJson) });
}

export async function upsertWebPushSubscription(req: Request, res: Response): Promise<void> {
  const user = requireUser(req, res);
  if (user === null) {
    return;
  }
  const body = req.body as UpsertWebPushSubscriptionBody;
  const row = await UserWebPushSubscriptionService.upsert({
    userId: user.id,
    endpoint: body.endpoint,
    keyP256dh: body.keys.p256dh,
    keyAuth: body.keys.auth,
    locale: body.locale ?? null,
  });
  res.status(200).json({ subscription: subscriptionToJson(row) });
}

export async function updateWebPushSubscription(req: Request, res: Response): Promise<void> {
  const user = requireUser(req, res);
  if (user === null) {
    return;
  }
  const subscriptionIdParam = req.params.subscriptionId;
  if (typeof subscriptionIdParam !== 'string') {
    res.status(400).json({ message: 'Invalid subscription id' });
    return;
  }
  const subscriptionId = subscriptionIdParam;
  const body = req.body as UpdateWebPushSubscriptionBody;
  const patch: {
    endpoint?: string;
    keyP256dh?: string;
    keyAuth?: string;
    locale?: string | null;
  } = {};
  if (body.endpoint !== undefined) {
    patch.endpoint = body.endpoint;
  }
  if (body.keys !== undefined) {
    patch.keyP256dh = body.keys.p256dh;
    patch.keyAuth = body.keys.auth;
  }
  if (body.locale !== undefined) {
    patch.locale = body.locale === '' ? null : body.locale;
  }
  const row = await UserWebPushSubscriptionService.updateForUser(subscriptionId, user.id, patch);
  if (row === null) {
    res.status(404).json({ message: 'Subscription not found' });
    return;
  }
  res.status(200).json({ subscription: subscriptionToJson(row) });
}

export async function deleteWebPushSubscription(req: Request, res: Response): Promise<void> {
  const user = requireUser(req, res);
  if (user === null) {
    return;
  }
  const subscriptionIdParam = req.params.subscriptionId;
  if (typeof subscriptionIdParam !== 'string') {
    res.status(400).json({ message: 'Invalid subscription id' });
    return;
  }
  const subscriptionId = subscriptionIdParam;
  const ok = await UserWebPushSubscriptionService.delete(subscriptionId, user.id);
  if (!ok) {
    res.status(404).json({ message: 'Subscription not found' });
    return;
  }
  res.status(204).send();
}
