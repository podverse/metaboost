import type { RequestHandler } from 'express';

import { Router } from 'express';

import * as termsVersionsController from '../controllers/termsVersionsController.js';
import { validateBody } from '../middleware/validateBody.js';
import { createTermsVersionSchema, updateTermsVersionSchema } from '../schemas/termsVersions.js';

export function createTermsVersionsRouter(
  requireAuth: RequestHandler,
  requireSuperAdminMiddleware: RequestHandler
): Router {
  const router = Router();

  router.get('/', requireAuth, requireSuperAdminMiddleware, (req, res, next) => {
    termsVersionsController.listTermsVersions(req, res).catch(next);
  });
  router.get('/:id', requireAuth, requireSuperAdminMiddleware, (req, res, next) => {
    termsVersionsController.getTermsVersion(req, res).catch(next);
  });
  router.post(
    '/',
    requireAuth,
    requireSuperAdminMiddleware,
    validateBody(createTermsVersionSchema),
    (req, res, next) => {
      termsVersionsController.createTermsVersion(req, res).catch(next);
    }
  );
  router.patch(
    '/:id',
    requireAuth,
    requireSuperAdminMiddleware,
    validateBody(updateTermsVersionSchema),
    (req, res, next) => {
      termsVersionsController.updateTermsVersion(req, res).catch(next);
    }
  );
  router.post(
    '/:id/promote-to-current',
    requireAuth,
    requireSuperAdminMiddleware,
    (req, res, next) => {
      termsVersionsController.promoteTermsVersionToCurrent(req, res).catch(next);
    }
  );

  return router;
}
