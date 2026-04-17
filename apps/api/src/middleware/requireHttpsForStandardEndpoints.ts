import type { NextFunction, Request, Response } from 'express';

import {
  getEffectiveRequestScheme,
  resolveStandardEndpointRequireHttps,
} from '../lib/standardEndpoint/httpsScheme.js';

/**
 * Rejects non-HTTPS requests to `/v1/standard/*` when HTTPS enforcement is active (see env docs).
 * Runs before AppAssertion and body parsing-dependent handlers.
 */
export function requireHttpsForStandardEndpoints(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!resolveStandardEndpointRequireHttps()) {
    next();
    return;
  }
  if (getEffectiveRequestScheme(req) === 'https') {
    next();
    return;
  }
  res.status(403).json({
    message:
      'HTTPS is required for this endpoint. Use TLS at the edge and set STANDARD_ENDPOINT_TRUST_PROXY when behind a reverse proxy.',
    errorCode: 'https_required',
  });
}
