import type { BillingDomainEventType } from '@metaboost/helpers';

import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('billing_domain_event')
export class BillingDomainEvent {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'event_type', type: 'varchar', length: 48 })
  eventType!: BillingDomainEventType;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'idempotency_key', type: 'varchar', length: 128, nullable: true })
  idempotencyKey!: string | null;

  @Column({ type: 'jsonb' })
  payload!: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
