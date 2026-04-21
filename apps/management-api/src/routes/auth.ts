import type { RequestHandler } from 'express';

import { Router } from 'express';

import * as authController from '../controllers/authController.js';
import { loginRateLimiter, moderateAuthRateLimiter } from '../middleware/rateLimit.js';
import { validateBody } from '../middleware/validateBody.js';
import { loginSchema, changePasswordSchema, updateProfileSchema } from '../schemas/auth.js';

export function createAuthRouter(requireAuth: RequestHandler): Router {
  const router = Router();
  router.post('/login', loginRateLimiter, validateBody(loginSchema), (req, res, next) => {
    authController.login(req, res).catch(next);
  });
  router.post('/logout', moderateAuthRateLimiter, (req, res) => {
    authController.logout(req, res);
  });
  router.post('/refresh', moderateAuthRateLimiter, (req, res, next) => {
    authController.refresh(req, res).catch(next);
  });
  router.get('/me', requireAuth, (req, res) => {
    authController.me(req, res);
  });
  router.post(
    '/change-password',
    moderateAuthRateLimiter,
    requireAuth,
    validateBody(changePasswordSchema),
    (req, res, next) => {
      authController.changePassword(req, res).catch(next);
    }
  );
  router.patch('/me', requireAuth, validateBody(updateProfileSchema), (req, res, next) => {
    authController.updateProfile(req, res).catch(next);
  });
  return router;
}
