import type { Request, Response, NextFunction } from 'express';

import { ManagementUserService } from '@boilerplate/management-orm';

import { verifyManagementToken } from '../lib/auth/jwt.js';

export interface RequireManagementAuthOptions {
  jwtSecret: string;
  sessionCookieName: string;
}

/**
 * Resolve access token from session cookie (first) or Authorization Bearer header.
 * Attaches the full management user to req.managementUser. Handlers must never serialize
 * req.managementUser in responses; use managementUserToJson.
 */
export function requireManagementAuth(options: RequireManagementAuthOptions | string) {
  const jwtSecret = typeof options === 'string' ? options : options.jwtSecret;
  const sessionCookieName =
    typeof options === 'string' ? 'management_api_session' : options.sessionCookieName;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const cookieToken = req.cookies?.[sessionCookieName];
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    const token =
      (typeof cookieToken === 'string' && cookieToken !== '' ? cookieToken : undefined) ??
      (bearerToken !== undefined && bearerToken !== '' ? bearerToken : undefined);

    if (token === undefined || token === '') {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const payload = verifyManagementToken(token, jwtSecret);
    if (payload === null) {
      res.status(401).json({ message: 'Invalid or expired token' });
      return;
    }

    let user: Awaited<ReturnType<typeof ManagementUserService.findById>>;
    try {
      user = await ManagementUserService.findById(payload.sub);
    } catch (err) {
      next(err);
      return;
    }
    if (user === null) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    req.managementUser = user;
    next();
  };
}
