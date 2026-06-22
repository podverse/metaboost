import { Router } from 'express';

import * as productController from '../controllers/productController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

/**
 * Unauthenticated product/membership read routes (public resolved trial/pricing read model).
 */
export function createProductRouter(): Router {
  const router = Router();
  router.get('/membership', asyncHandler(productController.getPublicProductMembership));
  return router;
}
