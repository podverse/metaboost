/**
 * Express app factory for management API. Used by server (index.ts) and integration tests.
 */
import type { Express, NextFunction, Request, Response } from 'express';

import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import swaggerUi from 'swagger-ui-express';

import { isEnvLogLevelDebug } from '@metaboost/helpers';

import { config } from './config/index.js';
import { registerHealthRoutes } from './lib/health/registerHealthRoutes.js';
import { requireManagementAuth } from './middleware/requireManagementAuth.js';
import { requireSuperAdmin } from './middleware/requireSuperAdmin.js';
import { openApiDocument } from './openapi.js';
import { createAdminsRouter } from './routes/admins.js';
import { createAppsRouter } from './routes/apps.js';
import { createAuthRouter } from './routes/auth.js';
import { createBucketsRouter } from './routes/buckets.js';
import { createEventsRouter } from './routes/events.js';
import { createTermsVersionsRouter } from './routes/termsVersions.js';
import { createUsersRouter } from './routes/users.js';

export function createApp(): Express {
  const app = express();

  // --- Global middleware: CORS, JSON body
  const corsOptions: { origin: string[] | boolean; credentials: boolean } = {
    origin: config.corsOrigins ?? true,
    credentials: true,
  };
  app.use(cors(corsOptions));
  app.use(cookieParser());
  app.use(express.json());

  // --- Unversioned GET /
  // Informal dev ping only (not for probes — use versioned /health).
  app.get('/', (_req: Request, res: Response): void => {
    res.status(200).json({ status: 'ok', message: 'Management API is online' });
  });

  // --- API docs (Swagger UI)
  const openApiDoc = {
    ...openApiDocument,
    servers: [{ url: config.apiVersionPath, description: `API ${config.apiVersionPath}` }],
  };
  const managementApiDocsPath = `${config.apiVersionPath}/api-docs`;
  app.use(managementApiDocsPath, swaggerUi.serve, swaggerUi.setup(openApiDoc));

  const requireAuth = requireManagementAuth({
    jwtSecret: config.jwtSecret,
    sessionCookieName: config.sessionCookieName,
  });
  const requireSuperAdminMiddleware = requireSuperAdmin;

  // --- Versioned router: meta, health, root, then feature routers
  const versionedRouter = express.Router();
  versionedRouter.get('/meta', (_req: Request, res: Response): void => {
    res.json({ status: 'ok', version: config.apiVersionPath, release: config.apiRelease });
  });
  registerHealthRoutes(versionedRouter, {
    skipValkeyReachabilityCheck: !config.managementApiValkeyReachabilityGate,
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
  versionedRouter.use(
    '/terms-versions',
    createTermsVersionsRouter(requireAuth, requireSuperAdminMiddleware)
  );

  app.use(config.apiVersionPath, versionedRouter);

  // --- Error handler
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
    if (isEnvLogLevelDebug()) {
      console.error('Unhandled Management API error', err);
    }
    res.status(500).json({ message: 'Internal server error' });
  });

  return app;
}
