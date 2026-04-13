import type { RequestHandler } from 'express';

import { Router } from 'express';

import * as bucketAdminInvitationsController from '../controllers/bucketAdminInvitationsController.js';
import * as bucketAdminsController from '../controllers/bucketAdminsController.js';
import * as bucketMessagesController from '../controllers/bucketMessagesController.js';
import * as bucketRolesController from '../controllers/bucketRolesController.js';
import * as bucketsController from '../controllers/bucketsController.js';
import { validateBody } from '../middleware/validateBody.js';
import {
  createBucketSchema,
  updateBucketSchema,
  createChildBucketSchema,
  createBucketAdminSchema,
  updateBucketAdminSchema,
  createBucketAdminInvitationSchema,
  createBucketRoleSchema,
  updateBucketRoleSchema,
} from '../schemas/buckets.js';

export function createBucketsRouter(requireAuthMiddleware: RequestHandler): Router {
  const router = Router();

  router.get('/', requireAuthMiddleware, bucketsController.listBuckets);
  router.post(
    '/',
    requireAuthMiddleware,
    validateBody(createBucketSchema),
    bucketsController.createBucket
  );
  router.get('/public/:id', bucketMessagesController.getPublicBucket);
  router.get('/public/:id/messages', bucketMessagesController.listPublicMessages);

  router.get('/:id', requireAuthMiddleware, bucketsController.getBucket);
  router.patch(
    '/:id',
    requireAuthMiddleware,
    validateBody(updateBucketSchema),
    bucketsController.updateBucket
  );
  router.delete('/:id', requireAuthMiddleware, bucketsController.deleteBucket);

  router.get('/:bucketId/buckets', requireAuthMiddleware, bucketsController.listChildBuckets);
  router.post(
    '/:bucketId/buckets',
    requireAuthMiddleware,
    validateBody(createChildBucketSchema),
    bucketsController.createChildBucket
  );

  router.get('/:bucketId/admins', requireAuthMiddleware, bucketAdminsController.listBucketAdmins);
  router.get(
    '/:bucketId/admins/:userId',
    requireAuthMiddleware,
    bucketAdminsController.getBucketAdmin
  );
  router.post(
    '/:bucketId/admins',
    requireAuthMiddleware,
    validateBody(createBucketAdminSchema),
    bucketAdminsController.createBucketAdmin
  );
  router.get(
    '/:bucketId/admin-invitations',
    requireAuthMiddleware,
    bucketAdminInvitationsController.listBucketAdminInvitations
  );
  router.post(
    '/:bucketId/admin-invitations',
    requireAuthMiddleware,
    validateBody(createBucketAdminInvitationSchema),
    bucketAdminInvitationsController.createBucketAdminInvitation
  );
  router.delete(
    '/:bucketId/admin-invitations/:invitationId',
    requireAuthMiddleware,
    bucketAdminInvitationsController.deleteBucketAdminInvitation
  );
  router.patch(
    '/:bucketId/admins/:userId',
    requireAuthMiddleware,
    validateBody(updateBucketAdminSchema),
    bucketAdminsController.updateBucketAdmin
  );
  router.delete(
    '/:bucketId/admins/:userId',
    requireAuthMiddleware,
    bucketAdminsController.deleteBucketAdmin
  );

  router.get('/:bucketId/roles', requireAuthMiddleware, bucketRolesController.listBucketRoles);
  router.post(
    '/:bucketId/roles',
    requireAuthMiddleware,
    validateBody(createBucketRoleSchema),
    bucketRolesController.createBucketRole
  );
  router.patch(
    '/:bucketId/roles/:roleId',
    requireAuthMiddleware,
    validateBody(updateBucketRoleSchema),
    bucketRolesController.updateBucketRole
  );
  router.delete(
    '/:bucketId/roles/:roleId',
    requireAuthMiddleware,
    bucketRolesController.deleteBucketRole
  );

  router.get('/:bucketId/messages', requireAuthMiddleware, bucketMessagesController.listMessages);
  router.get('/:bucketId/messages/:id', requireAuthMiddleware, bucketMessagesController.getMessage);
  router.delete(
    '/:bucketId/messages/:id',
    requireAuthMiddleware,
    bucketMessagesController.deleteMessage
  );

  return router;
}
