import { Router } from 'express';

import * as mbrssV1Controller from '../controllers/mbrssV1Controller.js';
import { validateBody } from '../middleware/validateBody.js';
import { createMbrssV1BoostSchema } from '../schemas/mbrssV1.js';

export function createMbrssV1Router(): Router {
  const router = Router();

  router.get('/boost/:bucketShortId', mbrssV1Controller.getBoostCapability);
  router.post(
    '/boost/:bucketShortId',
    validateBody(createMbrssV1BoostSchema),
    mbrssV1Controller.createBoostMessage
  );
  router.get('/messages/public/:bucketShortId', mbrssV1Controller.listPublicMessages);
  router.get(
    '/messages/public/:bucketShortId/channel/:podcastGuid',
    mbrssV1Controller.listPublicMessagesForChannel
  );
  router.get(
    '/messages/public/:bucketShortId/item/:itemGuid',
    mbrssV1Controller.listPublicMessagesForItem
  );

  return router;
}
