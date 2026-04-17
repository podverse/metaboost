import type { ApiDocsBundle } from '../lib/api-docs.js';
import type { Router } from 'express';
import type { Request, Response } from 'express';

import { Router as createRouter } from 'express';

import { requireAppAssertionForPost } from '../middleware/requireAppAssertion.js';
import { requireHttpsForStandardEndpoints } from '../middleware/requireHttpsForStandardEndpoints.js';
import { createMbrssV1Router } from './mbrssV1.js';

/**
 * Router for Standard Endpoint namespace routes (`/standard/*`).
 * mbrss-v1 is currently the only standard, but this module centralizes future additions.
 */
export function createStandardEndpointRouter(apiDocsBundle: ApiDocsBundle): Router {
  const router = createRouter();

  router.use(requireHttpsForStandardEndpoints);
  router.use(requireAppAssertionForPost);

  router.get('/mbrss-v1/openapi.json', (_req: Request, res: Response): void => {
    res.status(200).json(apiDocsBundle.openApiMbrssV1Doc);
  });
  router.use('/mbrss-v1', createMbrssV1Router());

  return router;
}
