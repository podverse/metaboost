import type { RequestHandler } from 'express';

import { Router } from 'express';

import * as bucketAdminInvitationsController from '../controllers/bucketAdminInvitationsController.js';
import * as bucketAdminsController from '../controllers/bucketAdminsController.js';
import * as bucketBlockedAppsController from '../controllers/bucketBlockedAppsController.js';
import * as bucketMessagesController from '../controllers/bucketMessagesController.js';
import * as bucketRolesController from '../controllers/bucketRolesController.js';
import * as bucketsController from '../controllers/bucketsController.js';
import { requireCrud } from '../middleware/requireCrud.js';
import { validateBody } from '../middleware/validateBody.js';
import {
  createBucketSchema,
  createChildBucketSchema,
  updateBucketSchema,
  createBucketAdminInvitationSchema,
  updateBucketAdminSchema,
  createBucketRoleSchema,
  updateBucketRoleSchema,
  addBlockedAppSchema,
} from '../schemas/buckets.js';

export function createBucketsRouter(requireAuth: RequestHandler): Router {
  const router = Router();

  router.get('/', requireAuth, requireCrud('buckets', 'read'), (req, res, next) => {
    bucketsController.listBuckets(req, res).catch(next);
  });
  router.get('/:id', requireAuth, requireCrud('buckets', 'read'), (req, res, next) => {
    bucketsController.getBucket(req, res).catch(next);
  });
  router.get('/:id/buckets', requireAuth, requireCrud('buckets', 'read'), (req, res, next) => {
    bucketsController.listChildBuckets(req, res).catch(next);
  });
  router.post(
    '/:id/buckets',
    requireAuth,
    requireCrud('buckets', 'create'),
    validateBody(createChildBucketSchema),
    (req, res, next) => {
      bucketsController.createChildBucket(req, res).catch(next);
    }
  );
  router.post(
    '/',
    requireAuth,
    requireCrud('buckets', 'create'),
    validateBody(createBucketSchema),
    (req, res, next) => {
      bucketsController.createBucket(req, res).catch(next);
    }
  );
  router.patch(
    '/:id',
    requireAuth,
    requireCrud('buckets', 'update'),
    validateBody(updateBucketSchema),
    (req, res, next) => {
      bucketsController.updateBucket(req, res).catch(next);
    }
  );
  router.delete('/:id', requireAuth, requireCrud('buckets', 'delete'), (req, res, next) => {
    bucketsController.deleteBucket(req, res).catch(next);
  });

  // Bucket admins: require buckets read + bucketAdmins CRUD (:id = bucket id/idText)
  router.get(
    '/:id/admins',
    requireAuth,
    requireCrud('buckets', 'read'),
    requireCrud('bucketAdmins', 'read'),
    (req, res, next) => {
      bucketAdminsController.listBucketAdmins(req, res).catch(next);
    }
  );
  router.get(
    '/:id/admins/:userId',
    requireAuth,
    requireCrud('buckets', 'read'),
    requireCrud('bucketAdmins', 'read'),
    (req, res, next) => {
      bucketAdminsController.getBucketAdmin(req, res).catch(next);
    }
  );
  router.patch(
    '/:id/admins/:userId',
    requireAuth,
    requireCrud('buckets', 'read'),
    requireCrud('bucketAdmins', 'update'),
    validateBody(updateBucketAdminSchema),
    (req, res, next) => {
      bucketAdminsController.updateBucketAdmin(req, res).catch(next);
    }
  );
  router.delete(
    '/:id/admins/:userId',
    requireAuth,
    requireCrud('buckets', 'read'),
    requireCrud('bucketAdmins', 'delete'),
    (req, res, next) => {
      bucketAdminsController.deleteBucketAdmin(req, res).catch(next);
    }
  );

  // Bucket admin invitations: require buckets read + bucketAdmins CRUD
  router.get(
    '/:id/admin-invitations',
    requireAuth,
    requireCrud('buckets', 'read'),
    requireCrud('bucketAdmins', 'read'),
    (req, res, next) => {
      bucketAdminInvitationsController.listBucketAdminInvitations(req, res).catch(next);
    }
  );
  router.post(
    '/:id/admin-invitations',
    requireAuth,
    requireCrud('buckets', 'read'),
    requireCrud('bucketAdmins', 'create'),
    validateBody(createBucketAdminInvitationSchema),
    (req, res, next) => {
      bucketAdminInvitationsController.createBucketAdminInvitation(req, res).catch(next);
    }
  );
  router.delete(
    '/:id/admin-invitations/:invitationId',
    requireAuth,
    requireCrud('buckets', 'read'),
    requireCrud('bucketAdmins', 'delete'),
    (req, res, next) => {
      bucketAdminInvitationsController.deleteBucketAdminInvitation(req, res).catch(next);
    }
  );

  // Bucket roles: require buckets read + bucketAdmins CRUD
  router.get(
    '/:id/roles',
    requireAuth,
    requireCrud('buckets', 'read'),
    requireCrud('bucketAdmins', 'read'),
    (req, res, next) => {
      bucketRolesController.listBucketRoles(req, res).catch(next);
    }
  );
  router.post(
    '/:id/roles',
    requireAuth,
    requireCrud('buckets', 'read'),
    requireCrud('bucketAdmins', 'create'),
    validateBody(createBucketRoleSchema),
    (req, res, next) => {
      bucketRolesController.createBucketRole(req, res).catch(next);
    }
  );
  router.patch(
    '/:id/roles/:roleId',
    requireAuth,
    requireCrud('buckets', 'read'),
    requireCrud('bucketAdmins', 'update'),
    validateBody(updateBucketRoleSchema),
    (req, res, next) => {
      bucketRolesController.updateBucketRole(req, res).catch(next);
    }
  );
  router.delete(
    '/:id/roles/:roleId',
    requireAuth,
    requireCrud('buckets', 'read'),
    requireCrud('bucketAdmins', 'delete'),
    (req, res, next) => {
      bucketRolesController.deleteBucketRole(req, res).catch(next);
    }
  );

  // Messages: require buckets read + messages CRUD
  router.get(
    '/:bucketId/messages',
    requireAuth,
    requireCrud('buckets', 'read'),
    requireCrud('messages', 'read'),
    (req, res, next) => {
      bucketMessagesController.listMessages(req, res).catch(next);
    }
  );
  router.get(
    '/:bucketId/messages/:messageId',
    requireAuth,
    requireCrud('buckets', 'read'),
    requireCrud('messages', 'read'),
    (req, res, next) => {
      bucketMessagesController.getMessage(req, res).catch(next);
    }
  );
  router.delete(
    '/:bucketId/messages/:messageId',
    requireAuth,
    requireCrud('buckets', 'read'),
    requireCrud('messages', 'delete'),
    (req, res, next) => {
      bucketMessagesController.deleteMessage(req, res).catch(next);
    }
  );

  // Blocked apps (per root bucket tree): bucket admin settings, align with other /:id/* admin routes
  router.get(
    '/:id/registry-apps',
    requireAuth,
    requireCrud('buckets', 'read'),
    requireCrud('bucketAdmins', 'read'),
    (req, res, next) => {
      bucketBlockedAppsController.listRegistryAppsForBucket(req, res).catch(next);
    }
  );
  router.get(
    '/:id/blocked-apps',
    requireAuth,
    requireCrud('buckets', 'read'),
    requireCrud('bucketAdmins', 'read'),
    (req, res, next) => {
      bucketBlockedAppsController.listBlockedApps(req, res).catch(next);
    }
  );
  router.post(
    '/:id/blocked-apps',
    requireAuth,
    requireCrud('buckets', 'read'),
    requireCrud('bucketAdmins', 'update'),
    validateBody(addBlockedAppSchema),
    (req, res, next) => {
      bucketBlockedAppsController.addBlockedApp(req, res).catch(next);
    }
  );
  router.delete(
    '/:id/blocked-apps/:blockedAppId',
    requireAuth,
    requireCrud('buckets', 'read'),
    requireCrud('bucketAdmins', 'update'),
    (req, res, next) => {
      bucketBlockedAppsController.removeBlockedApp(req, res).catch(next);
    }
  );

  return router;
}
