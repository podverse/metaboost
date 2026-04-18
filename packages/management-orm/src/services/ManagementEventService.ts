import type { EventVisibility } from '../entities/AdminPermissions.js';
import type { ActorType } from '../entities/ManagementEvent.js';
import type { AscDescSortOrder, SqlSortDirection } from '@metaboost/helpers';

import { v4 as uuidv4 } from 'uuid';

import { managementDataSource } from '../data-source.js';
import { ManagementEvent } from '../entities/ManagementEvent.js';

type RecordEventParams = {
  actorId: string;
  actorType: ActorType;
  actorDisplayName?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  details?: string | null;
};

export type EventsSortOrder = 'recent' | 'oldest';

/** Allowed sort fields for findEventsWithVisibility (matches UI column ids). */
export const EVENTS_SORT_FIELDS = ['timestamp', 'actor', 'action', 'target', 'details'] as const;

export type ListEventsOptions = {
  visibility: EventVisibility;
  actorId: string;
  actorType: ActorType;
  limit?: number;
  offset?: number;
  /** Legacy: timestamp order only (recent = DESC, oldest = ASC). Ignored when sortBy is set. */
  order?: EventsSortOrder;
  /** Sort field (timestamp, actor, action, target, details). When set, sortOrder is used. */
  sortBy?: string;
  /** asc or desc. Used when sortBy is set. */
  sortOrder?: AscDescSortOrder;
  /** When set, ILIKE search over action, actor_type, target_type, target_id, details. */
  search?: string;
};

export class ManagementEventService {
  static async record(params: RecordEventParams): Promise<ManagementEvent> {
    const repo = managementDataSource.getRepository(ManagementEvent);
    const event = repo.create({
      id: uuidv4(),
      actorId: params.actorId,
      actorType: params.actorType,
      actorDisplayName: params.actorDisplayName ?? null,
      action: params.action,
      targetType: params.targetType ?? null,
      targetId: params.targetId ?? null,
      details: params.details ?? null,
    });
    return repo.save(event);
  }

  static async updateActorDisplayName(actorId: string, displayName: string): Promise<void> {
    await managementDataSource
      .getRepository(ManagementEvent)
      .createQueryBuilder()
      .update()
      .set({ actorDisplayName: displayName })
      .where('actor_id = :actorId', { actorId })
      .execute();
  }

  /**
   * List events filtered by visibility and return total count. Super admin: use visibility 'all'.
   * Admin: use their event_visibility (own | all_admins | all).
   */
  static async findEventsWithVisibility(options: ListEventsOptions): Promise<{
    events: ManagementEvent[];
    total: number;
  }> {
    const repo = managementDataSource.getRepository(ManagementEvent);
    const limit = options.limit ?? 100;
    const offset = options.offset ?? 0;
    const sortBy =
      options.sortBy !== undefined &&
      (EVENTS_SORT_FIELDS as readonly string[]).includes(options.sortBy)
        ? options.sortBy
        : undefined;
    const sortOrder: SqlSortDirection =
      options.sortOrder === 'asc' ? 'ASC' : options.sortOrder === 'desc' ? 'DESC' : 'DESC';
    const order = sortBy !== undefined ? sortOrder : options.order === 'oldest' ? 'ASC' : 'DESC';

    const qb = repo.createQueryBuilder('e').take(limit).skip(offset);

    if (sortBy !== undefined) {
      if (sortBy === 'timestamp') {
        qb.orderBy('e.timestamp', sortOrder);
      } else if (sortBy === 'actor') {
        qb.orderBy('COALESCE(e.actorDisplayName, e.actorId)', sortOrder);
      } else if (sortBy === 'action') {
        qb.orderBy('e.action', sortOrder);
      } else if (sortBy === 'target') {
        qb.orderBy("COALESCE(e.targetType, e.targetId, '')", sortOrder);
      } else if (sortBy === 'details') {
        qb.orderBy("COALESCE(e.details, '')", sortOrder);
      } else {
        qb.orderBy('e.timestamp', sortOrder);
      }
    } else {
      qb.orderBy('e.timestamp', order);
    }

    if (options.visibility === 'own') {
      qb.andWhere('e.actor_id = :actorId', { actorId: options.actorId });
    } else if (options.visibility === 'all_admins') {
      qb.andWhere("e.actor_type = 'admin'");
    }
    const searchTrim = options.search?.trim();
    if (searchTrim !== undefined && searchTrim !== '') {
      qb.andWhere(
        "(e.action ILIKE :searchPattern OR e.actor_type ILIKE :searchPattern OR COALESCE(e.target_type, '') ILIKE :searchPattern OR COALESCE(e.target_id, '') ILIKE :searchPattern OR COALESCE(e.details, '') ILIKE :searchPattern)",
        { searchPattern: `%${searchTrim}%` }
      );
    }
    const [events, total] = await qb.getManyAndCount();
    return { events, total };
  }
}
