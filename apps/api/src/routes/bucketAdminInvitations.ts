import type { RequestHandler } from 'express';

import { Router } from 'express';

import * as bucketAdminInvitationsController from '../controllers/bucketAdminInvitationsController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export function createBucketAdminInvitationsRouter(requireAuthMiddleware: RequestHandler): Router {
  const router = Router();

  router.get('/:token', asyncHandler(bucketAdminInvitationsController.getInvitationByToken));
  router.post(
    '/:token/accept',
    requireAuthMiddleware,
    asyncHandler(bucketAdminInvitationsController.acceptInvitation)
  );
  router.post(
    '/:token/reject',
    requireAuthMiddleware,
    asyncHandler(bucketAdminInvitationsController.rejectInvitation)
  );

  return router;
}
