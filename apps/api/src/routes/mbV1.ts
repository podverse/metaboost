import { Router } from 'express';

import * as mbV1Controller from '../controllers/mbV1Controller.js';
import { validateBody } from '../middleware/validateBody.js';
import { createMbV1BoostSchema } from '../schemas/mbV1.js';

export function createMbV1Router(): Router {
  const router = Router();

  router.get('/boost/:bucketShortId', mbV1Controller.getBoostCapability);
  router.post(
    '/boost/:bucketShortId',
    validateBody(createMbV1BoostSchema),
    mbV1Controller.createBoostMessage
  );
  router.get('/messages/public/:bucketShortId', mbV1Controller.listPublicMessages);

  return router;
}
