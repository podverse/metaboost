import { Router } from 'express';

import * as mbV1Controller from '../controllers/mbV1Controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validateBody } from '../middleware/validateBody.js';
import { createMbV1BoostSchema } from '../schemas/mbV1.js';

export function createMbV1Router(): Router {
  const router = Router();

  router.get('/boost/:bucketShortId', asyncHandler(mbV1Controller.getBoostCapability));
  router.post(
    '/boost/:bucketShortId',
    validateBody(createMbV1BoostSchema),
    asyncHandler(mbV1Controller.createBoostMessage)
  );
  router.get('/messages/public/:bucketShortId', asyncHandler(mbV1Controller.listPublicMessages));

  return router;
}
