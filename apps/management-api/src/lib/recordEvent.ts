import type { ManagementUser } from '@boilerplate/management-orm';

import { ManagementEventService, type ActorType } from '@boilerplate/management-orm';

export type RecordEventParams = {
  actor: ManagementUser;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  details?: string | null;
};

export async function recordEvent(params: RecordEventParams): Promise<void> {
  const actorType: ActorType = params.actor.isSuperAdmin ? 'super_admin' : 'admin';
  await ManagementEventService.record({
    actorId: params.actor.id,
    actorType,
    actorDisplayName: params.actor.bio?.displayName ?? null,
    action: params.action,
    targetType: params.targetType ?? null,
    targetId: params.targetId ?? null,
    details: params.details ?? null,
  });
}
