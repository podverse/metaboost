import type { Request, Response, NextFunction } from 'express';

/**
 * Requires req.managementUser to be set (by requireManagementAuth) and to be super admin.
 */
export function requireSuperAdmin(req: Request, res: Response, next: NextFunction): void {
  const user = req.managementUser;
  if (user === undefined) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  if (!user.isSuperAdmin) {
    res.status(403).json({ message: 'Super admin only' });
    return;
  }
  next();
}
