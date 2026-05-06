import type { BillingDomainEventType } from '@metaboost/helpers';
import type { EntityManager } from 'typeorm';

import { appDataSourceReadWrite } from '../data-source.js';
import { BillingDomainEvent } from '../entities/BillingDomainEvent.js';

function isUniqueViolation(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    (error as { code: string }).code === '23505'
  );
}

export class BillingDomainEventLogService {
  async append(params: {
    eventType: BillingDomainEventType;
    userId: string;
    idempotencyKey?: string | null;
    payload?: Record<string, unknown>;
    manager?: EntityManager;
  }): Promise<void> {
    const manager = params.manager ?? appDataSourceReadWrite.manager;
    const repo = manager.getRepository(BillingDomainEvent);
    try {
      await repo.save(
        repo.create({
          eventType: params.eventType,
          userId: params.userId,
          idempotencyKey: params.idempotencyKey ?? null,
          payload: params.payload ?? {},
        })
      );
    } catch (error) {
      if (
        isUniqueViolation(error) &&
        params.idempotencyKey !== null &&
        params.idempotencyKey !== undefined
      ) {
        return;
      }
      throw error;
    }
  }
}
