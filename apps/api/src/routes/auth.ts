import type { AuthModeCapabilities } from '../config/index.js';
import type { RequestHandler } from 'express';

import { Router } from 'express';

import * as authController from '../controllers/authController.js';
import { moderateAuthRateLimiter, strictAuthRateLimiter } from '../middleware/rateLimit.js';
import { validateBody } from '../middleware/validateBody.js';
import {
  loginSchema,
  signupSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  createSetPasswordSchema,
  requestEmailChangeSchema,
  updateProfileSchema,
  acceptLatestTermsSchema,
} from '../schemas/auth.js';

export function createAuthRouter(
  requireAuthMiddleware: RequestHandler,
  authModeCapabilities: AuthModeCapabilities
): Router {
  const router = Router();
  const setPasswordSchema = createSetPasswordSchema(authModeCapabilities);

  router.post('/login', strictAuthRateLimiter, validateBody(loginSchema), (req, res, next) => {
    authController.login(req, res).catch(next);
  });
  router.post('/logout', (req, res) => {
    authController.logout(req, res);
  });
  router.post('/refresh', (req, res, next) => {
    authController.refresh(req, res).catch(next);
  });
  router.post(
    '/change-password',
    moderateAuthRateLimiter,
    requireAuthMiddleware,
    validateBody(changePasswordSchema),
    (req, res, next) => {
      authController.changePassword(req, res).catch(next);
    }
  );
  router.get('/me', requireAuthMiddleware, (req, res, next) => {
    authController.me(req, res).catch(next);
  });
  router.get('/username-available', moderateAuthRateLimiter, (req, res, next) => {
    authController.usernameAvailable(req, res).catch(next);
  });
  router.patch(
    '/me',
    moderateAuthRateLimiter,
    requireAuthMiddleware,
    validateBody(updateProfileSchema),
    (req, res, next) => {
      authController.updateProfile(req, res).catch(next);
    }
  );
  router.patch(
    '/terms-acceptance',
    moderateAuthRateLimiter,
    requireAuthMiddleware,
    validateBody(acceptLatestTermsSchema),
    (req, res, next) => {
      authController.acceptLatestTerms(req, res).catch(next);
    }
  );
  router.delete('/me', moderateAuthRateLimiter, requireAuthMiddleware, (req, res, next) => {
    authController.deleteMe(req, res).catch(next);
  });

  if (authModeCapabilities.canPublicSignup) {
    router.post('/signup', strictAuthRateLimiter, validateBody(signupSchema), (req, res, next) => {
      authController.signup(req, res).catch(next);
    });
  } else {
    router.post('/signup', strictAuthRateLimiter, (_req, res) => {
      res.status(403).json({ message: 'Registration is by admin only' });
    });
  }

  // Plan 34: verification flows (mailer mode only)
  router.post('/verify-email', strictAuthRateLimiter, (req, res, next) => {
    if (!authModeCapabilities.canUseEmailVerificationFlows) {
      res.status(403).json({ message: 'Email verification is not enabled' });
      return;
    }
    authController.verifyEmail(req, res).catch(next);
  });
  router.post(
    '/forgot-password',
    strictAuthRateLimiter,
    validateBody(forgotPasswordSchema),
    (req, res, next) => {
      if (!authModeCapabilities.canUseEmailVerificationFlows) {
        res.status(403).json({ message: 'Email verification is not enabled' });
        return;
      }
      authController.forgotPassword(req, res).catch(next);
    }
  );
  router.post(
    '/reset-password',
    strictAuthRateLimiter,
    validateBody(resetPasswordSchema),
    (req, res, next) => {
      if (!authModeCapabilities.canUseEmailVerificationFlows) {
        res.status(403).json({ message: 'Email verification is not enabled' });
        return;
      }
      authController.resetPassword(req, res).catch(next);
    }
  );
  router.post(
    '/set-password',
    strictAuthRateLimiter,
    validateBody(setPasswordSchema),
    (req, res, next) => {
      authController.setPassword(req, res).catch(next);
    }
  );
  router.post(
    '/request-email-change',
    strictAuthRateLimiter,
    requireAuthMiddleware,
    validateBody(requestEmailChangeSchema),
    (req, res, next) => {
      if (!authModeCapabilities.canUseEmailVerificationFlows) {
        res.status(403).json({ message: 'Email verification is not enabled' });
        return;
      }
      authController.requestEmailChange(req, res).catch(next);
    }
  );
  router.post('/confirm-email-change', strictAuthRateLimiter, (req, res, next) => {
    if (!authModeCapabilities.canUseEmailVerificationFlows) {
      res.status(403).json({ message: 'Email verification is not enabled' });
      return;
    }
    authController.confirmEmailChange(req, res).catch(next);
  });

  return router;
}
