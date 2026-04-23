import { Router } from 'express';

import * as exchangeRatesController from '../controllers/exchangeRatesController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export function createExchangeRatesRouter(): Router {
  const router = Router();
  router.get('/', asyncHandler(exchangeRatesController.getPublicExchangeRates));
  return router;
}
