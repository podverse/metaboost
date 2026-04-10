/**
 * Express app factory. Builds the app without calling listen() so it can be used
 * by the server (index.ts) and by integration tests (supertest).
 */
import type { Express } from 'express';
import type { NextFunction, Request, Response } from 'express';

import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import swaggerUi from 'swagger-ui-express';

import { config } from './config/index.js';
import { requireAuth } from './middleware/requireAuth.js';
import { openApiDocument } from './openapi.js';
import { createAuthRouter } from './routes/auth.js';
import { createBucketAdminInvitationsRouter } from './routes/bucketAdminInvitations.js';
import { createBucketsRouter } from './routes/buckets.js';

export function createApp(): Express {
  const app = express();
  const corsOptions: { origin: string[] | boolean; credentials: boolean } = {
    origin: config.corsOrigins ?? true,
    credentials: true,
  };
  app.use(cors(corsOptions));
  app.use(cookieParser());
  app.use(express.json());

  const openApiDoc = {
    ...openApiDocument,
    servers: [{ url: config.apiVersionPath, description: `API ${config.apiVersionPath}` }],
  };
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDoc));

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
  versionedRouter.use('/auth', createAuthRouter(authMiddleware, config.authModeCapabilities));
  versionedRouter.use('/buckets', createBucketsRouter(authMiddleware));
  versionedRouter.use('/admin-invitations', createBucketAdminInvitationsRouter(authMiddleware));

  app.use(config.apiVersionPath, versionedRouter);

  app.use((_err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
    res.status(500).json({ message: 'Internal server error' });
  });

  return app;
}
