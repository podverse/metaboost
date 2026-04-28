import { Router } from 'express';

import * as mbrssV1Controller from '../controllers/mbrssV1Controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validateBody } from '../middleware/validateBody.js';
import { createMbrssV1BoostSchema } from '../schemas/mbrssV1.js';

export function createMbrssV1Router(): Router {
  const router = Router();

  router.get('/boost/:bucketIdText', asyncHandler(mbrssV1Controller.getBoostCapability));
  router.post(
    '/boost/:bucketIdText',
    validateBody(createMbrssV1BoostSchema),
    asyncHandler(mbrssV1Controller.createBoostMessage)
  );
  router.get('/messages/public/:bucketIdText', asyncHandler(mbrssV1Controller.listPublicMessages));
  router.get(
    '/messages/public/:bucketIdText/channel/:podcastGuid',
    asyncHandler(mbrssV1Controller.listPublicMessagesForChannel)
  );
  router.get(
    '/messages/public/:bucketIdText/item/:itemGuid',
    asyncHandler(mbrssV1Controller.listPublicMessagesForItem)
  );

  return router;
}
