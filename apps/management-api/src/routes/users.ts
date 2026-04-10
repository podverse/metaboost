import type { RequestHandler } from 'express';

import { Router } from 'express';

import * as usersController from '../controllers/usersController.js';
import { requireCrud } from '../middleware/requireCrud.js';
import { validateBody } from '../middleware/validateBody.js';
import { createUserSchema, updateUserSchema, changeUserPasswordSchema } from '../schemas/users.js';

export function createUsersRouter(requireAuth: RequestHandler): Router {
  const router = Router();

  router.get('/', requireAuth, requireCrud('users', 'read'), (req, res, next) => {
    usersController.listUsers(req, res).catch(next);
  });
  router.get('/:id', requireAuth, requireCrud('users', 'read'), (req, res, next) => {
    usersController.getUser(req, res).catch(next);
  });
  router.post(
    '/',
    requireAuth,
    requireCrud('users', 'create'),
    validateBody(createUserSchema),
    (req, res, next) => {
      usersController.createUser(req, res).catch(next);
    }
  );
  router.patch(
    '/:id',
    requireAuth,
    requireCrud('users', 'update'),
    validateBody(updateUserSchema),
    (req, res, next) => {
      usersController.updateUser(req, res).catch(next);
    }
  );
  router.delete('/:id', requireAuth, requireCrud('users', 'delete'), (req, res, next) => {
    usersController.deleteUser(req, res).catch(next);
  });
  router.post(
    '/:id/change-password',
    requireAuth,
    validateBody(changeUserPasswordSchema),
    (req, res, next) => {
      usersController.changeUserPassword(req, res).catch(next);
    }
  );

  return router;
}
