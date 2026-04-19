/**
 * Express app factory for management API. Used by server (index.ts) and integration tests.
 */
import type { Express } from 'express';
import type { NextFunction, Request, Response } from 'express';

import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import swaggerUi from 'swagger-ui-express';

import { config } from './config/index.js';
import { requireManagementAuth } from './middleware/requireManagementAuth.js';
import { requireSuperAdmin } from './middleware/requireSuperAdmin.js';
import { openApiDocument } from './openapi.js';
import { createAdminsRouter } from './routes/admins.js';
import { createAppsRouter } from './routes/apps.js';
import { createAuthRouter } from './routes/auth.js';
import { createBucketsRouter } from './routes/buckets.js';
import { createEventsRouter } from './routes/events.js';
import { createUsersRouter } from './routes/users.js';

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
    res.status(200).json({ status: 'ok', message: 'Management API is online' });
  });

  const requireAuth = requireManagementAuth({
    jwtSecret: config.jwtSecret,
    sessionCookieName: config.sessionCookieName,
  });
  const requireSuperAdminMiddleware = requireSuperAdmin;

  const versionedRouter = express.Router();
  versionedRouter.get('/health', (_req: Request, res: Response): void => {
    res.json({ status: 'ok', message: 'The server is running.' });
  });
  versionedRouter.get('/', (_req: Request, res: Response): void => {
    res.status(200).json({ status: 'ok', message: 'Management API is online' });
  });
  versionedRouter.use('/auth', createAuthRouter(requireAuth));
  versionedRouter.use('/admins', createAdminsRouter(requireAuth, requireSuperAdminMiddleware));
  versionedRouter.use('/apps', createAppsRouter(requireAuth));
  versionedRouter.use('/users', createUsersRouter(requireAuth));
  versionedRouter.use('/buckets', createBucketsRouter(requireAuth));
  versionedRouter.use('/events', createEventsRouter(requireAuth));

  app.use(config.apiVersionPath, versionedRouter);

  app.use((_err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
    res.status(500).json({ message: 'Internal server error' });
  });

  return app;
}
