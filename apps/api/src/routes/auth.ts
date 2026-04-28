import type { AccountSignupModeCapabilities } from '../config/index.js';
import type { RequestHandler } from 'express';

import { Router } from 'express';

import * as authController from '../controllers/authController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
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
  confirmEmailChangeSchema,
  verifyEmailSchema,
} from '../schemas/auth.js';

export function createAuthRouter(
  requireAuthMiddleware: RequestHandler,
  accountSignupModeCapabilities: AccountSignupModeCapabilities
): Router {
  const router = Router();
  const setPasswordSchema = createSetPasswordSchema(accountSignupModeCapabilities);
  const verifyEmailHandler = asyncHandler(authController.verifyEmail);
  const forgotPasswordHandler = asyncHandler(authController.forgotPassword);
  const resetPasswordHandler = asyncHandler(authController.resetPassword);
  const requestEmailChangeHandler = asyncHandler(authController.requestEmailChange);
  const confirmEmailChangeHandler = asyncHandler(authController.confirmEmailChange);

  router.post(
    '/login',
    strictAuthRateLimiter,
    validateBody(loginSchema),
    asyncHandler(authController.login)
  );
  router.post('/logout', moderateAuthRateLimiter, asyncHandler(authController.logout));
  router.post('/refresh', moderateAuthRateLimiter, asyncHandler(authController.refresh));
  router.post(
    '/change-password',
    moderateAuthRateLimiter,
    requireAuthMiddleware,
    validateBody(changePasswordSchema),
    asyncHandler(authController.changePassword)
  );
  router.get('/me', requireAuthMiddleware, asyncHandler(authController.me));
  router.get(
    '/username-available',
    moderateAuthRateLimiter,
    asyncHandler(authController.usernameAvailable)
  );
  router.patch(
    '/me',
    moderateAuthRateLimiter,
    requireAuthMiddleware,
    validateBody(updateProfileSchema),
    asyncHandler(authController.updateProfile)
  );
  router.patch(
    '/terms-acceptance',
    moderateAuthRateLimiter,
    requireAuthMiddleware,
    validateBody(acceptLatestTermsSchema),
    asyncHandler(authController.acceptLatestTerms)
  );
  router.delete(
    '/me',
    moderateAuthRateLimiter,
    requireAuthMiddleware,
    asyncHandler(authController.deleteMe)
  );

  if (accountSignupModeCapabilities.canPublicSignup) {
    router.post(
      '/signup',
      strictAuthRateLimiter,
      validateBody(signupSchema),
      asyncHandler(authController.signup)
    );
  } else {
    router.post('/signup', strictAuthRateLimiter, (_req, res) => {
      res.status(403).json({ message: 'Registration is by admin only' });
    });
  }

  // Plan 34: verification flows (mailer mode only)
  router.post(
    '/verify-email',
    strictAuthRateLimiter,
    validateBody(verifyEmailSchema),
    (req, res, next) => {
      if (!accountSignupModeCapabilities.canUseEmailVerificationFlows) {
        res.status(403).json({ message: 'Email verification is not enabled' });
        return;
      }
      verifyEmailHandler(req, res, next);
    }
  );
  router.post(
    '/forgot-password',
    strictAuthRateLimiter,
    validateBody(forgotPasswordSchema),
    (req, res, next) => {
      if (!accountSignupModeCapabilities.canUseEmailVerificationFlows) {
        res.status(403).json({ message: 'Email verification is not enabled' });
        return;
      }
      forgotPasswordHandler(req, res, next);
    }
  );
  router.post(
    '/reset-password',
    strictAuthRateLimiter,
    validateBody(resetPasswordSchema),
    (req, res, next) => {
      if (!accountSignupModeCapabilities.canUseEmailVerificationFlows) {
        res.status(403).json({ message: 'Email verification is not enabled' });
        return;
      }
      resetPasswordHandler(req, res, next);
    }
  );
  router.post(
    '/set-password',
    strictAuthRateLimiter,
    validateBody(setPasswordSchema),
    asyncHandler(authController.setPassword)
  );
  router.post(
    '/request-email-change',
    strictAuthRateLimiter,
    requireAuthMiddleware,
    validateBody(requestEmailChangeSchema),
    (req, res, next) => {
      if (!accountSignupModeCapabilities.canUseEmailVerificationFlows) {
        res.status(403).json({ message: 'Email verification is not enabled' });
        return;
      }
      requestEmailChangeHandler(req, res, next);
    }
  );
  router.post(
    '/confirm-email-change',
    strictAuthRateLimiter,
    validateBody(confirmEmailChangeSchema),
    (req, res, next) => {
      if (!accountSignupModeCapabilities.canUseEmailVerificationFlows) {
        res.status(403).json({ message: 'Email verification is not enabled' });
        return;
      }
      confirmEmailChangeHandler(req, res, next);
    }
  );

  return router;
}
