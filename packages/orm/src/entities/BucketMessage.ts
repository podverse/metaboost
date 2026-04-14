import type { Bucket } from './Bucket.js';

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';

import { SHORT_TEXT_MAX_LENGTH } from '@metaboost/helpers';

import { BucketMessageAppMeta } from './BucketMessageAppMeta.js';
import { BucketMessagePaymentVerification } from './BucketMessagePaymentVerification.js';
import { BucketMessageRecipientOutcomeEntity } from './BucketMessageRecipientOutcome.js';

export const MB1_PAYMENT_RECIPIENT_STATUSES = ['verified', 'failed', 'undetermined'] as const;
export type Mb1PaymentRecipientStatus = (typeof MB1_PAYMENT_RECIPIENT_STATUSES)[number];

export const MB1_PAYMENT_VERIFICATION_LEVELS = [
  'fully-verified',
  'verified-largest-recipient-succeeded',
  'partially-verified',
  'not-verified',
] as const;
export type Mb1PaymentVerificationLevel = (typeof MB1_PAYMENT_VERIFICATION_LEVELS)[number];

export type BucketMessageRecipientOutcome = {
  type: string;
  address: string;
  split: number;
  name: string | null;
  custom_key: string | null;
  custom_value: string | null;
  fee: boolean;
  status: Mb1PaymentRecipientStatus;
};

@Entity('bucket_message')
export class BucketMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'message_guid', type: 'uuid', unique: true })
  messageGuid!: string;

  @Column({ name: 'bucket_id' })
  bucketId!: string;

  @Column({ name: 'sender_name', type: 'varchar', length: SHORT_TEXT_MAX_LENGTH, nullable: true })
  senderName!: string | null;

  @Column({ type: 'text' })
  body!: string;

  @Column({ name: 'currency', type: 'varchar', length: SHORT_TEXT_MAX_LENGTH })
  currency!: string;

  @Column({ name: 'amount', type: 'numeric' })
  amount!: string;

  @Column({ name: 'amount_unit', type: 'varchar', length: SHORT_TEXT_MAX_LENGTH, nullable: true })
  amountUnit!: string | null;

  @Column({ name: 'action', type: 'varchar', length: SHORT_TEXT_MAX_LENGTH })
  action!: string;

  @Column({ name: 'is_public', type: 'boolean', default: false })
  isPublic!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne('Bucket', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bucket_id' })
  bucket!: Bucket;

  @OneToOne(() => BucketMessageAppMeta, (appMeta) => appMeta.message)
  appMeta?: BucketMessageAppMeta;

  @OneToOne(
    () => BucketMessagePaymentVerification,
    (paymentVerification) => paymentVerification.message
  )
  paymentVerification?: BucketMessagePaymentVerification;

  @OneToMany(
    () => BucketMessageRecipientOutcomeEntity,
    (recipientOutcomeEntity) => recipientOutcomeEntity.message
  )
  recipientOutcomeEntities?: BucketMessageRecipientOutcomeEntity[];

  // Compatibility fields hydrated by BucketMessageService to preserve current API payload shape.
  appName!: string;
  appVersion!: string | null;
  senderId!: string | null;
  podcastIndexFeedId!: number | null;
  timePosition!: string | null;
  paymentVerifiedByApp!: boolean;
  paymentVerificationLevel!: Mb1PaymentVerificationLevel;
  paymentRecipientOutcomes!: BucketMessageRecipientOutcome[];
  paymentRecipientVerifiedCount!: number;
  paymentRecipientFailedCount!: number;
  paymentRecipientUndeterminedCount!: number;
}
