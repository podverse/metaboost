import type { ActorType } from '@boilerplate/management-orm';
import type { Request, Response } from 'express';

import { DEFAULT_PAGE_LIMIT, MAX_PAGE_SIZE, MAX_TOTAL_CAP } from '@boilerplate/helpers';
import { ManagementEventService } from '@boilerplate/management-orm';

/**
 * Safe shape for event in API responses. No sensitive data.
 */
function eventToJson(e: {
  id: string;
  actorId: string;
  actorType: string;
  actorDisplayName: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  timestamp: Date;
  details: string | null;
}) {
  return {
    id: e.id,
    actorId: e.actorId,
    actorType: e.actorType,
    actorDisplayName: e.actorDisplayName,
    action: e.action,
    targetType: e.targetType,
    targetId: e.targetId,
    timestamp: e.timestamp instanceof Date ? e.timestamp.toISOString() : e.timestamp,
    details: e.details,
  };
}

export async function listEvents(req: Request, res: Response): Promise<void> {
  const user = req.managementUser;
  if (user === undefined) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(req.query.limit) || DEFAULT_PAGE_LIMIT));
  const sortRaw = req.query.sort;
  const order = sortRaw === 'oldest' ? 'oldest' : 'recent';
  const sortByRaw = typeof req.query.sortBy === 'string' ? req.query.sortBy.trim() : undefined;
  const sortBy = sortByRaw === '' ? undefined : sortByRaw;
  const sortOrderRaw = req.query.sortOrder;
  const sortOrder = sortOrderRaw === 'asc' || sortOrderRaw === 'desc' ? sortOrderRaw : undefined;
  const searchRaw = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;
  const search = searchRaw === '' ? undefined : searchRaw;
  const offset = (page - 1) * limit;
  const visibility = user.isSuperAdmin
    ? 'all'
    : (user.permissions?.eventVisibility ?? 'all_admins');
  const { events, total } = await ManagementEventService.findEventsWithVisibility({
    visibility,
    actorId: user.id,
    actorType: (user.isSuperAdmin ? 'super_admin' : 'admin') as ActorType,
    limit,
    offset,
    order,
    sortBy,
    sortOrder,
    search,
  });
  const cappedTotal = total > MAX_TOTAL_CAP ? MAX_TOTAL_CAP : total;
  const totalPages = Math.max(1, Math.ceil(cappedTotal / limit));
  const truncatedTotal = total > MAX_TOTAL_CAP;
  res.status(200).json({
    events: events.map(eventToJson),
    total: cappedTotal,
    page,
    limit,
    totalPages,
    ...(truncatedTotal && { truncatedTotal: true }),
  });
}
