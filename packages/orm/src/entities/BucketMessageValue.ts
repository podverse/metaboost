import type { BucketMessage } from './BucketMessage.js';

import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';

import { SHORT_TEXT_MAX_LENGTH } from '@metaboost/helpers';

@Entity('bucket_message_value')
export class BucketMessageValue {
  @PrimaryColumn('uuid', { name: 'bucket_message_id' })
  bucketMessageId!: string;

  @Column({ name: 'currency', type: 'varchar', length: SHORT_TEXT_MAX_LENGTH })
  currency!: string;

  @Column({ name: 'amount', type: 'numeric' })
  amount!: string;

  @Column({ name: 'amount_unit', type: 'varchar', length: SHORT_TEXT_MAX_LENGTH, nullable: true })
  amountUnit!: string | null;

  @Column({
    name: 'threshold_currency_at_create',
    type: 'varchar',
    length: SHORT_TEXT_MAX_LENGTH,
    nullable: true,
  })
  thresholdCurrencyAtCreate!: string | null;

  @Column({ name: 'threshold_amount_minor_at_create', type: 'int', nullable: true })
  thresholdAmountMinorAtCreate!: number | null;

  @OneToOne('BucketMessage', (message: BucketMessage) => message.value, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bucket_message_id' })
  message!: BucketMessage;
}
