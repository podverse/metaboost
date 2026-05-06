import type { Request, Response } from 'express';

import { BillingPriceCatalogService } from '@metaboost/orm';

import { config } from '../config/index.js';
import { buildPublicProductMembershipReadModel } from '../lib/billingReadModelSerialization.js';

const catalog = new BillingPriceCatalogService();

/**
 * Public read model: resolved membership trial/pricing and signup visibility flag.
 */
export async function getPublicProductMembership(_req: Request, res: Response): Promise<void> {
  const resolvedProductMembership = await catalog.resolveProductMembership();
  const data = buildPublicProductMembershipReadModel({
    resolvedProductMembership,
    selfServePublicSignupOpen: config.accountSignupModeCapabilities.canPublicSignup,
  });
  res.status(200).json({ data });
}
