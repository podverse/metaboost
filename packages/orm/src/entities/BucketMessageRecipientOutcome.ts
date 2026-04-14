import type { Mb1PaymentRecipientStatus } from './BucketMessage.js';
import type { BucketMessage } from './BucketMessage.js';

import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { MEDIUM_TEXT_MAX_LENGTH, SHORT_TEXT_MAX_LENGTH } from '@metaboost/helpers';

@Entity('bucket_message_recipient_outcome')
export class BucketMessageRecipientOutcomeEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'bucket_message_id', type: 'uuid' })
  bucketMessageId!: string;

  @Column({ name: 'recipient_order', type: 'integer' })
  recipientOrder!: number;

  @Column({ name: 'recipient_type', type: 'varchar', length: SHORT_TEXT_MAX_LENGTH })
  recipientType!: string;

  @Column({ name: 'address', type: 'varchar', length: MEDIUM_TEXT_MAX_LENGTH })
  address!: string;

  @Column({ name: 'split', type: 'numeric' })
  split!: string;

  @Column({ name: 'name', type: 'varchar', length: MEDIUM_TEXT_MAX_LENGTH, nullable: true })
  name!: string | null;

  @Column({ name: 'custom_key', type: 'varchar', length: SHORT_TEXT_MAX_LENGTH, nullable: true })
  customKey!: string | null;

  @Column({ name: 'custom_value', type: 'varchar', length: MEDIUM_TEXT_MAX_LENGTH, nullable: true })
  customValue!: string | null;

  @Column({ name: 'fee', type: 'boolean' })
  fee!: boolean;

  @Column({ name: 'status', type: 'varchar', length: SHORT_TEXT_MAX_LENGTH })
  status!: Mb1PaymentRecipientStatus;

  @ManyToOne('BucketMessage', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bucket_message_id' })
  message!: BucketMessage;
}
