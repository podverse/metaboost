import type { RequestHandler } from 'express';

import { Router } from 'express';

import * as bucketAdminInvitationsController from '../controllers/bucketAdminInvitationsController.js';

export function createBucketAdminInvitationsRouter(requireAuthMiddleware: RequestHandler): Router {
  const router = Router();

  router.get('/:token', bucketAdminInvitationsController.getInvitationByToken);
  router.post(
    '/:token/accept',
    requireAuthMiddleware,
    bucketAdminInvitationsController.acceptInvitation
  );
  router.post(
    '/:token/reject',
    requireAuthMiddleware,
    bucketAdminInvitationsController.rejectInvitation
  );

  return router;
}
