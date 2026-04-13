import type { ApiDocsBundle } from '../lib/api-docs.js';
import type { Router } from 'express';
import type { Request, Response } from 'express';

import { Router as createRouter } from 'express';

import { createMb1Router } from './mb1.js';

/**
 * Router for standards namespace routes (/s/*).
 * MB1 is currently the only standard, but this module centralizes future additions.
 */
export function createStandardsRouter(apiDocsBundle: ApiDocsBundle): Router {
  const router = createRouter();

  router.get('/mb1/openapi.json', (_req: Request, res: Response): void => {
    res.status(200).json(apiDocsBundle.openApiMb1Doc);
  });
  router.use('/mb1', createMb1Router());

  return router;
}
