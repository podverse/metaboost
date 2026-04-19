import type { RequestHandler } from 'express';

import { Router } from 'express';

import * as globalBlockedAppsController from '../controllers/globalBlockedAppsController.js';
import { requireCrud } from '../middleware/requireCrud.js';
import { validateBody } from '../middleware/validateBody.js';
import { addGlobalBlockedAppSchema } from '../schemas/apps.js';

export function createAppsRouter(requireAuth: RequestHandler): Router {
  const router = Router();

  router.get('/', requireAuth, requireCrud('admins', 'read'), (req, res, next) => {
    globalBlockedAppsController.listGlobalBlockedApps(req, res).catch(next);
  });
  router.post(
    '/global-blocked',
    requireAuth,
    requireCrud('admins', 'update'),
    validateBody(addGlobalBlockedAppSchema),
    (req, res, next) => {
      globalBlockedAppsController.addGlobalBlockedApp(req, res).catch(next);
    }
  );
  router.delete(
    '/global-blocked/:appId',
    requireAuth,
    requireCrud('admins', 'update'),
    (req, res, next) => {
      globalBlockedAppsController.removeGlobalBlockedApp(req, res).catch(next);
    }
  );

  return router;
}
