import type { UserWithRelations } from '@metaboost/orm';
import type { Request, Response } from 'express';

/**
 * Handlers mounted after requireAuth should always have req.user set; this guard
 * keeps TypeScript narrow and preserves a consistent 401 JSON shape if wiring changes.
 */
export function requireUser(req: Request, res: Response): UserWithRelations | null {
  if (req.user === undefined) {
    res.status(401).json({ message: 'Authentication required' });
    return null;
  }
  return req.user;
}
