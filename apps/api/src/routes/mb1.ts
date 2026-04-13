import { Router } from 'express';

import * as mb1Controller from '../controllers/mb1Controller.js';
import { validateBody } from '../middleware/validateBody.js';
import { confirmMb1PaymentSchema, createMb1BoostSchema } from '../schemas/mb1.js';

export function createMb1Router(): Router {
  const router = Router();

  router.get('/boost/:bucketShortId', mb1Controller.getBoostCapability);
  router.post(
    '/boost/:bucketShortId',
    validateBody(createMb1BoostSchema),
    mb1Controller.createBoostMessage
  );
  router.post(
    '/boost/:bucketShortId/confirm-payment',
    validateBody(confirmMb1PaymentSchema),
    mb1Controller.confirmBoostPayment
  );
  router.get('/messages/public/:bucketShortId', mb1Controller.listPublicMessages);
  router.get(
    '/messages/public/:bucketShortId/channel/:podcastGuid',
    mb1Controller.listPublicMessagesForChannel
  );
  router.get(
    '/messages/public/:bucketShortId/item/:itemGuid',
    mb1Controller.listPublicMessagesForItem
  );

  return router;
}
