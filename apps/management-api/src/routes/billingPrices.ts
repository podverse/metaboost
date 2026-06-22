import type { RequestHandler } from 'express';

import { Router } from 'express';

import * as billingPricesController from '../controllers/billingPricesController.js';
import { requireCrud } from '../middleware/requireCrud.js';
import { validateBody } from '../middleware/validateBody.js';
import {
  deprecateBillingPriceSchema,
  scheduleBillingPriceSchema,
} from '../schemas/billingPrices.js';

export function createBillingPricesRouter(requireAuth: RequestHandler): Router {
  const router = Router();

  router.get('/windows', requireAuth, requireCrud('billingPrices', 'read'), (req, res, next) => {
    billingPricesController.listPriceWindows(req, res).catch(next);
  });
  router.get('/audit', requireAuth, requireCrud('billingPrices', 'read'), (req, res, next) => {
    billingPricesController.listPriceChangeAudit(req, res).catch(next);
  });
  router.get('/', requireAuth, requireCrud('billingPrices', 'read'), (req, res, next) => {
    billingPricesController.listActivePrices(req, res).catch(next);
  });
  router.post(
    '/',
    requireAuth,
    requireCrud('billingPrices', 'create'),
    validateBody(scheduleBillingPriceSchema),
    (req, res, next) => {
      billingPricesController.schedulePriceChange(req, res).catch(next);
    }
  );
  router.post(
    '/:id/deprecate',
    requireAuth,
    requireCrud('billingPrices', 'update'),
    validateBody(deprecateBillingPriceSchema),
    (req, res, next) => {
      billingPricesController.deprecatePrice(req, res).catch(next);
    }
  );

  return router;
}
