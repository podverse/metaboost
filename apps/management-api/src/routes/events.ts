import type { RequestHandler } from 'express';

import { Router } from 'express';

import * as eventsController from '../controllers/eventsController.js';

export function createEventsRouter(requireAuth: RequestHandler): Router {
  const router = Router();
  router.get('/', requireAuth, (req, res, next) => {
    eventsController.listEvents(req, res).catch(next);
  });
  return router;
}
