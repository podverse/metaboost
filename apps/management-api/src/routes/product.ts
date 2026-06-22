import type { NextFunction, Request, RequestHandler, Response } from 'express';

import { Router } from 'express';

import { BillingPriceCatalogService } from '@metaboost/orm';

export function createProductRouter(
  requireAuth: RequestHandler,
  requireBillingPricesRead: RequestHandler
): Router {
  const catalog = new BillingPriceCatalogService();

  const membershipRouter = Router();
  membershipRouter.get(
    '/',
    requireAuth,
    requireBillingPricesRead,
    async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const data = await catalog.resolveProductMembership();
        res.json({ data });
      } catch (err) {
        next(err);
      }
    }
  );

  const productRouter = Router();
  productRouter.use('/membership', membershipRouter);
  return productRouter;
}
