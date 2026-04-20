import { Router } from 'express';

import * as exchangeRatesController from '../controllers/exchangeRatesController.js';

export function createExchangeRatesRouter(): Router {
  const router = Router();
  router.get('/', exchangeRatesController.getPublicExchangeRates);
  return router;
}
