import type { RequestHandler } from 'express';

import { Router } from 'express';

import * as adminRolesController from '../controllers/adminRolesController.js';
import * as adminsController from '../controllers/adminsController.js';
import { requireCrud } from '../middleware/requireCrud.js';
import { validateBody } from '../middleware/validateBody.js';
import {
  createAdminSchema,
  updateAdminSchema,
  changePasswordSchema,
  createManagementAdminRoleSchema,
  updateManagementAdminRoleSchema,
} from '../schemas/admins.js';

export function createAdminsRouter(
  requireAuth: RequestHandler,
  requireSuperAdminMiddleware: RequestHandler
): Router {
  const router = Router();

  router.get('/', requireAuth, requireCrud('admins', 'read'), (req, res, next) => {
    adminsController.listAdmins(req, res).catch(next);
  });
  router.get('/roles', requireAuth, requireCrud('admins', 'read'), (req, res, next) => {
    adminRolesController.listManagementAdminRoles(req, res).catch(next);
  });
  router.post(
    '/roles',
    requireAuth,
    requireCrud('admins', 'create'),
    validateBody(createManagementAdminRoleSchema),
    (req, res, next) => {
      adminRolesController.createManagementAdminRole(req, res).catch(next);
    }
  );
  router.patch(
    '/roles/:roleId',
    requireAuth,
    requireCrud('admins', 'update'),
    validateBody(updateManagementAdminRoleSchema),
    (req, res, next) => {
      adminRolesController.updateManagementAdminRole(req, res).catch(next);
    }
  );
  router.delete(
    '/roles/:roleId',
    requireAuth,
    requireCrud('admins', 'delete'),
    (req, res, next) => {
      adminRolesController.deleteManagementAdminRole(req, res).catch(next);
    }
  );
  router.get('/:id', requireAuth, requireCrud('admins', 'read'), (req, res, next) => {
    adminsController.getAdmin(req, res).catch(next);
  });
  router.post(
    '/',
    requireAuth,
    requireSuperAdminMiddleware,
    validateBody(createAdminSchema),
    (req, res, next) => {
      adminsController.createAdmin(req, res).catch(next);
    }
  );
  router.patch(
    '/:id',
    requireAuth,
    requireCrud('admins', 'update'),
    validateBody(updateAdminSchema),
    (req, res, next) => {
      adminsController.updateAdmin(req, res).catch(next);
    }
  );
  router.delete('/:id', requireAuth, requireCrud('admins', 'delete'), (req, res, next) => {
    adminsController.deleteAdmin(req, res).catch(next);
  });
  router.post(
    '/change-password',
    requireAuth,
    validateBody(changePasswordSchema),
    (req, res, next) => {
      adminsController.changePassword(req, res).catch(next);
    }
  );

  return router;
}
