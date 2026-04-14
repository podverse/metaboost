import type { Mb1PaymentRecipientStatus, Mb1PaymentVerificationLevel } from './BucketMessage.js';
import type { BucketMessage } from './BucketMessage.js';

import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';

import { SHORT_TEXT_MAX_LENGTH } from '@metaboost/helpers';

@Entity('bucket_message_payment_verification')
export class BucketMessagePaymentVerification {
  @PrimaryColumn('uuid', { name: 'bucket_message_id' })
  bucketMessageId!: string;

  @Column({ name: 'verified_by_app', type: 'boolean', default: false })
  verifiedByApp!: boolean;

  @Column({
    name: 'verification_level',
    type: 'varchar',
    length: SHORT_TEXT_MAX_LENGTH,
    default: 'not-verified',
  })
  verificationLevel!: Mb1PaymentVerificationLevel;

  @Column({ name: 'recipient_verified_count', type: 'integer', default: 0 })
  recipientVerifiedCount!: number;

  @Column({ name: 'recipient_failed_count', type: 'integer', default: 0 })
  recipientFailedCount!: number;

  @Column({ name: 'recipient_undetermined_count', type: 'integer', default: 0 })
  recipientUndeterminedCount!: number;

  @Column({
    name: 'largest_recipient_status',
    type: 'varchar',
    length: SHORT_TEXT_MAX_LENGTH,
    default: 'undetermined',
  })
  largestRecipientStatus!: Mb1PaymentRecipientStatus;

  @OneToOne('BucketMessage', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bucket_message_id' })
  message!: BucketMessage;
}
