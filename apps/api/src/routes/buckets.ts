import type { RequestHandler } from 'express';

import { Router } from 'express';

import * as bucketAdminInvitationsController from '../controllers/bucketAdminInvitationsController.js';
import * as bucketAdminsController from '../controllers/bucketAdminsController.js';
import * as bucketBlockedAppsController from '../controllers/bucketBlockedAppsController.js';
import * as bucketBlockedSendersController from '../controllers/bucketBlockedSendersController.js';
import * as bucketMessagesController from '../controllers/bucketMessagesController.js';
import * as bucketRolesController from '../controllers/bucketRolesController.js';
import * as bucketsController from '../controllers/bucketsController.js';
import * as exchangeRatesController from '../controllers/exchangeRatesController.js';
import * as publicBucketsController from '../controllers/publicBucketsController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
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

  router.get('/', requireAuthMiddleware, asyncHandler(bucketsController.listBuckets));
  router.post(
    '/',
    requireAuthMiddleware,
    validateBody(createBucketSchema),
    asyncHandler(bucketsController.createBucket)
  );
  router.get(
    '/summary',
    requireAuthMiddleware,
    asyncHandler(bucketMessagesController.getDashboardSummary)
  );
  router.get(
    '/public/:id/conversion',
    asyncHandler(exchangeRatesController.getPublicBucketConversionRatios)
  );
  router.get('/public/:id', asyncHandler(publicBucketsController.getPublicBucket));

  router.get('/:id', requireAuthMiddleware, asyncHandler(bucketsController.getBucket));
  router.patch(
    '/:id',
    requireAuthMiddleware,
    validateBody(updateBucketSchema),
    asyncHandler(bucketsController.updateBucket)
  );
  router.delete('/:id', requireAuthMiddleware, asyncHandler(bucketsController.deleteBucket));

  router.get(
    '/:bucketId/buckets',
    requireAuthMiddleware,
    asyncHandler(bucketsController.listChildBuckets)
  );
  router.post(
    '/:bucketId/buckets',
    requireAuthMiddleware,
    validateBody(createChildBucketSchema),
    asyncHandler(bucketsController.createChildBucket)
  );
  router.post(
    '/:bucketId/rss/verify',
    requireAuthMiddleware,
    asyncHandler(bucketsController.verifyRssChannel)
  );

  router.get(
    '/:bucketId/admins',
    requireAuthMiddleware,
    asyncHandler(bucketAdminsController.listBucketAdmins)
  );
  router.get(
    '/:bucketId/admins/:userId',
    requireAuthMiddleware,
    asyncHandler(bucketAdminsController.getBucketAdmin)
  );
  router.post(
    '/:bucketId/admins',
    requireAuthMiddleware,
    validateBody(createBucketAdminSchema),
    asyncHandler(bucketAdminsController.createBucketAdmin)
  );
  router.get(
    '/:bucketId/admin-invitations',
    requireAuthMiddleware,
    asyncHandler(bucketAdminInvitationsController.listBucketAdminInvitations)
  );
  router.post(
    '/:bucketId/admin-invitations',
    requireAuthMiddleware,
    validateBody(createBucketAdminInvitationSchema),
    asyncHandler(bucketAdminInvitationsController.createBucketAdminInvitation)
  );
  router.delete(
    '/:bucketId/admin-invitations/:invitationId',
    requireAuthMiddleware,
    asyncHandler(bucketAdminInvitationsController.deleteBucketAdminInvitation)
  );
  router.patch(
    '/:bucketId/admins/:userId',
    requireAuthMiddleware,
    validateBody(updateBucketAdminSchema),
    asyncHandler(bucketAdminsController.updateBucketAdmin)
  );
  router.delete(
    '/:bucketId/admins/:userId',
    requireAuthMiddleware,
    asyncHandler(bucketAdminsController.deleteBucketAdmin)
  );

  router.get(
    '/:bucketId/roles',
    requireAuthMiddleware,
    asyncHandler(bucketRolesController.listBucketRoles)
  );
  router.post(
    '/:bucketId/roles',
    requireAuthMiddleware,
    validateBody(createBucketRoleSchema),
    asyncHandler(bucketRolesController.createBucketRole)
  );
  router.patch(
    '/:bucketId/roles/:roleId',
    requireAuthMiddleware,
    validateBody(updateBucketRoleSchema),
    asyncHandler(bucketRolesController.updateBucketRole)
  );
  router.delete(
    '/:bucketId/roles/:roleId',
    requireAuthMiddleware,
    asyncHandler(bucketRolesController.deleteBucketRole)
  );

  router.get(
    '/:bucketId/registry-apps',
    requireAuthMiddleware,
    asyncHandler(bucketBlockedAppsController.listRegistryAppsForBucket)
  );
  router.get(
    '/:bucketId/blocked-apps',
    requireAuthMiddleware,
    asyncHandler(bucketBlockedAppsController.listBlockedApps)
  );
  router.post(
    '/:bucketId/blocked-apps',
    requireAuthMiddleware,
    validateBody(addBlockedAppSchema),
    asyncHandler(bucketBlockedAppsController.addBlockedApp)
  );
  router.delete(
    '/:bucketId/blocked-apps/:blockedAppId',
    requireAuthMiddleware,
    asyncHandler(bucketBlockedAppsController.removeBlockedApp)
  );

  router.get(
    '/:bucketId/blocked-senders',
    requireAuthMiddleware,
    asyncHandler(bucketBlockedSendersController.listBlockedSenders)
  );
  router.post(
    '/:bucketId/blocked-senders',
    requireAuthMiddleware,
    validateBody(addBlockedSenderSchema),
    asyncHandler(bucketBlockedSendersController.addBlockedSender)
  );
  router.delete(
    '/:bucketId/blocked-senders/:blockedSenderId',
    requireAuthMiddleware,
    asyncHandler(bucketBlockedSendersController.removeBlockedSender)
  );

  router.get(
    '/:bucketId/messages',
    requireAuthMiddleware,
    asyncHandler(bucketMessagesController.listMessages)
  );
  router.get(
    '/:bucketId/summary',
    requireAuthMiddleware,
    asyncHandler(bucketMessagesController.getBucketSummary)
  );
  router.get(
    '/:bucketId/messages/:id',
    requireAuthMiddleware,
    asyncHandler(bucketMessagesController.getMessage)
  );
  router.delete(
    '/:bucketId/messages/:id',
    requireAuthMiddleware,
    asyncHandler(bucketMessagesController.deleteMessage)
  );

  return router;
}
