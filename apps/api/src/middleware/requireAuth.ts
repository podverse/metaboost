import type { Request, Response, NextFunction } from 'express';

import { UserService } from '@metaboost/orm';

import { config } from '../config/index.js';
import { resolveJwtClaimOptions, verifyToken } from '../lib/auth/jwt.js';

export interface RequireAuthOptions {
  jwtSecret: string;
  sessionCookieName: string;
}

/**
 * Resolve access token from session cookie (first) or Authorization Bearer header.
 * Attaches the full user to req.user. Handlers must never serialize req.user in responses;
 * use userToJson (or similar) so passwordHash and other credentials are never sent.
 */
export function requireAuth(options: RequireAuthOptions | string) {
  const jwtSecret = typeof options === 'string' ? options : options.jwtSecret;
  const sessionCookieName = typeof options === 'string' ? 'api_session' : options.sessionCookieName;

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

    const payload = verifyToken(
      token,
      jwtSecret,
      resolveJwtClaimOptions(config.jwtIssuer, config.jwtAudience)
    );
    if (payload === null) {
      res.status(401).json({ message: 'Invalid or expired token' });
      return;
    }

    let user: Awaited<ReturnType<typeof UserService.findById>>;
    try {
      user = await UserService.findById(payload.sub);
    } catch (err) {
      next(err);
      return;
    }
    if (user === null) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    req.user = user;
    next();
  };
}
