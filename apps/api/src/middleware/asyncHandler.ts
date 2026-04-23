import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Wraps an async (or Promise-returning) request handler so rejected promises are
 * forwarded to Express as `next(err)` instead of becoming unhandled rejections, which
 * can leave the client with a closed connection and errors like "socket hang up" in
 * supertest. Sync handlers that return `void` are also supported.
 */
type AsyncishRequestHandler = (req: Request, res: Response) => void | Promise<void>;

export function asyncHandler(fn: AsyncishRequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    void Promise.resolve(fn(req, res)).catch(next);
  };
}
