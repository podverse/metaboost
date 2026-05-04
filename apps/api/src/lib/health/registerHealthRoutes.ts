import type { IRouter, Request, Response } from 'express';

import { appDataSourceRead } from '@metaboost/orm';

import { testValkeyConnection } from '../valkey/testValkeyConnection.js';

/**
 * Registers `/health` and `/health/ready` on the API version router.
 */
export function registerHealthRoutes(router: IRouter): void {
  router.get('/health', (_req: Request, res: Response): void => {
    res.json({ status: 'ok', message: 'The server is running.' });
  });

  router.get('/health/ready', async (_req: Request, res: Response): Promise<void> => {
    try {
      if (!appDataSourceRead.isInitialized) {
        res.status(503).json({ status: 'unavailable', message: 'Database not reachable' });
        return;
      }
      await appDataSourceRead.query('SELECT 1');
    } catch {
      res.status(503).json({ status: 'unavailable', message: 'Database not reachable' });
      return;
    }

    const ok = await testValkeyConnection();
    if (ok) {
      res.status(200).json({ status: 'ok', message: 'Ready' });
    } else {
      res.status(503).json({ status: 'unavailable', message: 'Valkey not reachable' });
    }
  });
}
