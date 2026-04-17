import type { NextFunction, Request, Response } from 'express';

import { verifyAppAssertionForPostRequest } from '../lib/appAssertion/verifyAppAssertion.js';
import { getAppRegistryService } from '../lib/appRegistry/singleton.js';

/**
 * Requires a valid AppAssertion JWT for POST requests to Standard Endpoint routes (`/v1/standard/*`).
 * GET and other methods pass through.
 */
export function requireAppAssertionForPost(req: Request, res: Response, next: NextFunction): void {
  if (req.method !== 'POST') {
    next();
    return;
  }

  void (async (): Promise<void> => {
    const result = await verifyAppAssertionForPostRequest({
      req,
      registry: getAppRegistryService(),
    });
    if (!result.ok) {
      res.status(result.status).json(result.body);
      return;
    }
    next();
  })().catch((err: unknown) => {
    next(err);
  });
}
