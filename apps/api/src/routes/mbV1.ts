import { Router } from 'express';

import * as mbV1Controller from '../controllers/mbV1Controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validateBody } from '../middleware/validateBody.js';
import { createMbV1BoostSchema } from '../schemas/mbV1.js';

export function createMbV1Router(): Router {
  const router = Router();

  router.get('/boost/:bucketIdText', asyncHandler(mbV1Controller.getBoostCapability));
  router.post(
    '/boost/:bucketIdText',
    validateBody(createMbV1BoostSchema),
    asyncHandler(mbV1Controller.createBoostMessage)
  );
  router.get('/messages/public/:bucketIdText', asyncHandler(mbV1Controller.listPublicMessages));

  return router;
}
