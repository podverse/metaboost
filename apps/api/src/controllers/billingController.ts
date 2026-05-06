import type { Request, Response } from 'express';

import { BillingPriceCatalogService } from '@metaboost/orm';

import { buildAuthenticatedBillingMembershipReadModel } from '../lib/billingReadModelSerialization.js';

const catalog = new BillingPriceCatalogService();

/**
 * Authenticated billing + catalog read model (client-safe; ISO strings for instants).
 */
export async function membershipSummary(req: Request, res: Response): Promise<void> {
  const user = req.user;
  if (user === undefined) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  const trust = user.trustSettings;
  if (trust === undefined) {
    res.status(404).json({ message: 'Membership settings not found' });
    return;
  }

  const catalogResolved = await catalog.resolveProductMembership();
  const data = buildAuthenticatedBillingMembershipReadModel({
    user,
    catalog: catalogResolved,
  });

  res.status(200).json({ data });
}
