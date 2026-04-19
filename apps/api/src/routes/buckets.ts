import type { RequestHandler } from 'express';

import { Router } from 'express';

import * as bucketAdminInvitationsController from '../controllers/bucketAdminInvitationsController.js';
import * as bucketAdminsController from '../controllers/bucketAdminsController.js';
import * as bucketBlockedAppsController from '../controllers/bucketBlockedAppsController.js';
import * as bucketBlockedSendersController from '../controllers/bucketBlockedSendersController.js';
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
  addBlockedAppSchema,
  addBlockedSenderSchema,
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
  router.get('/summary', requireAuthMiddleware, bucketMessagesController.getDashboardSummary);
  router.get('/public/:id/conversion', bucketMessagesController.convertPublicBucketAmount);
  router.get('/public/:id', bucketMessagesController.getPublicBucket);

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
  router.post('/:bucketId/rss/verify', requireAuthMiddleware, bucketsController.verifyRssChannel);

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

  router.get(
    '/:bucketId/registry-apps',
    requireAuthMiddleware,
    bucketBlockedAppsController.listRegistryAppsForBucket
  );
  router.get(
    '/:bucketId/blocked-apps',
    requireAuthMiddleware,
    bucketBlockedAppsController.listBlockedApps
  );
  router.post(
    '/:bucketId/blocked-apps',
    requireAuthMiddleware,
    validateBody(addBlockedAppSchema),
    bucketBlockedAppsController.addBlockedApp
  );
  router.delete(
    '/:bucketId/blocked-apps/:blockedAppId',
    requireAuthMiddleware,
    bucketBlockedAppsController.removeBlockedApp
  );

  router.get(
    '/:bucketId/blocked-senders',
    requireAuthMiddleware,
    bucketBlockedSendersController.listBlockedSenders
  );
  router.post(
    '/:bucketId/blocked-senders',
    requireAuthMiddleware,
    validateBody(addBlockedSenderSchema),
    bucketBlockedSendersController.addBlockedSender
  );
  router.delete(
    '/:bucketId/blocked-senders/:blockedSenderId',
    requireAuthMiddleware,
    bucketBlockedSendersController.removeBlockedSender
  );

  router.get('/:bucketId/messages', requireAuthMiddleware, bucketMessagesController.listMessages);
  router.get(
    '/:bucketId/summary',
    requireAuthMiddleware,
    bucketMessagesController.getBucketSummary
  );
  router.get('/:bucketId/messages/:id', requireAuthMiddleware, bucketMessagesController.getMessage);
  router.delete(
    '/:bucketId/messages/:id',
    requireAuthMiddleware,
    bucketMessagesController.deleteMessage
  );

  return router;
}
