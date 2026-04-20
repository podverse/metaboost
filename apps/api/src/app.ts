/**
 * Express app factory. Builds the app without calling listen() so it can be used
 * by the server (index.ts) and by integration tests (supertest).
 */
import type { Express } from 'express';
import type { NextFunction, Request, Response } from 'express';

import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';

import { config } from './config/index.js';
import { createApiDocsBundle, registerApiDocs } from './lib/api-docs.js';
import { requireAuth } from './middleware/requireAuth.js';
import { createAuthRouter } from './routes/auth.js';
import { createBucketAdminInvitationsRouter } from './routes/bucketAdminInvitations.js';
import { createBucketsRouter } from './routes/buckets.js';
import { createExchangeRatesRouter } from './routes/exchangeRates.js';
import { createStandardEndpointRouter } from './routes/standardEndpoint.js';

/**
 * Browser-facing public routes that should allow cross-origin GET from integrator apps.
 * Includes standard endpoint routes and public bucket conversion endpoint.
 */
function isPublicBrowserReadablePath(path: string): boolean {
  const standardPrefix = `${config.apiVersionPath}/standard`;
  if (path === standardPrefix || path.startsWith(`${standardPrefix}/`)) {
    return true;
  }
  const conversionRegex = new RegExp(
    `^${config.apiVersionPath}/buckets/public/[^/]+/conversion(-snapshot)?/?$`
  );
  return conversionRegex.test(path);
}

export function createApp(): Express {
  const app = express();
  const restrictiveCors = cors({
    origin: config.corsOrigins ?? true,
    credentials: true,
  });
  const publicStandardsCors = cors({ origin: true, credentials: true });
  app.use((req: Request, res: Response, next: NextFunction): void => {
    const handler = isPublicBrowserReadablePath(req.path) ? publicStandardsCors : restrictiveCors;
    handler(req, res, next);
  });
  app.use(cookieParser());
  app.use(
    express.json({
      verify: (req: Request, _res, buf: Buffer): void => {
        const pathOnly = (req.originalUrl ?? req.url ?? '').split('?')[0] ?? '';
        if (req.method === 'POST' && pathOnly.includes('/standard/')) {
          req.rawBody = Buffer.from(buf);
        }
      },
    })
  );

  const apiDocsBundle = createApiDocsBundle();
  registerApiDocs(app, apiDocsBundle);

  app.get('/', (_req: Request, res: Response): void => {
    res.status(200).json({ status: 'ok', message: 'API is online' });
  });

  const authMiddleware = requireAuth({
    jwtSecret: config.jwtSecret,
    sessionCookieName: config.sessionCookieName,
  });
  const versionedRouter = express.Router();
  versionedRouter.get('/health', (_req: Request, res: Response): void => {
    res.json({ status: 'ok', message: 'The server is running.' });
  });
  versionedRouter.get('/', (_req: Request, res: Response): void => {
    res.status(200).json({ status: 'ok', message: 'API is online' });
  });
  versionedRouter.use('/standard', createStandardEndpointRouter(apiDocsBundle));
  versionedRouter.use('/auth', createAuthRouter(authMiddleware, config.authModeCapabilities));
  versionedRouter.use('/buckets', createBucketsRouter(authMiddleware));
  versionedRouter.use('/exchange-rates', createExchangeRatesRouter());
  versionedRouter.use('/admin-invitations', createBucketAdminInvitationsRouter(authMiddleware));

  app.use(config.apiVersionPath, versionedRouter);

  app.use((_err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
    res.status(500).json({ message: 'Internal server error' });
  });

  return app;
}
