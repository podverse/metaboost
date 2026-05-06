import type {
  DeprecateBillingPriceBody,
  ScheduleBillingPriceBody,
} from '../schemas/billingPrices.js';
import type { Request, Response } from 'express';

import {
  BILLING_PRICE_GOVERNANCE_DEFAULT_CURRENCY,
  BillingPriceGovernanceService,
} from '@metaboost/orm';

const governance = new BillingPriceGovernanceService();

export async function listActivePrices(req: Request, res: Response): Promise<void> {
  if (req.managementUser === undefined) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  const prices = await governance.listActivePrices();
  res.json({
    data: {
      prices,
      defaultCurrency: BILLING_PRICE_GOVERNANCE_DEFAULT_CURRENCY,
    },
  });
}

export async function schedulePriceChange(req: Request, res: Response): Promise<void> {
  const user = req.managementUser;
  if (user === undefined) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  const body = req.body as ScheduleBillingPriceBody;
  const effectiveFrom =
    body.effectiveFrom instanceof Date ? body.effectiveFrom : new Date(body.effectiveFrom);
  const result = await governance.schedulePriceChange({
    currencyCode: body.currencyCode,
    billingCadence: body.billingCadence,
    amountCents: body.amountCents,
    effectiveFrom,
    changeReason: body.changeReason === '' ? null : (body.changeReason ?? null),
    changedByManagementUserId: user.id,
  });
  res.status(201).json({ data: result });
}

export async function listPriceWindows(req: Request, res: Response): Promise<void> {
  if (req.managementUser === undefined) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  const windows = await governance.listPriceWindows();
  res.json({
    data: {
      windows,
      defaultCurrency: BILLING_PRICE_GOVERNANCE_DEFAULT_CURRENCY,
    },
  });
}

export async function listPriceChangeAudit(req: Request, res: Response): Promise<void> {
  if (req.managementUser === undefined) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  const rawLimit = req.query.limit;
  let limit = 100;
  if (typeof rawLimit === 'string') {
    const parsed = Number.parseInt(rawLimit, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      limit = Math.min(parsed, 200);
    }
  }
  const entries = await governance.listPriceChangeAudit(limit);
  res.json({ data: { entries } });
}

export async function deprecatePrice(req: Request, res: Response): Promise<void> {
  const user = req.managementUser;
  if (user === undefined) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  const rawParam = req.params.id;
  const idSegment = Array.isArray(rawParam) ? rawParam[0] : rawParam;
  if (typeof idSegment !== 'string' || idSegment === '') {
    res.status(400).json({ message: 'Invalid price id' });
    return;
  }
  const priceId = Number.parseInt(idSegment, 10);
  if (!Number.isFinite(priceId) || String(priceId) !== idSegment) {
    res.status(400).json({ message: 'Invalid price id' });
    return;
  }
  const body = req.body as DeprecateBillingPriceBody;
  try {
    await governance.deprecatePrice({
      priceId,
      changeReason: body.changeReason === '' ? null : (body.changeReason ?? null),
      changedByManagementUserId: user.id,
    });
  } catch (err) {
    if (err instanceof Error && err.message.includes('not found')) {
      res.status(404).json({ message: 'Price not found' });
      return;
    }
    throw err;
  }
  res.status(204).send();
}
