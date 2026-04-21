import type { Bucket } from './Bucket.js';

import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';

import { SHORT_TEXT_MAX_LENGTH } from '@metaboost/helpers';

@Entity('bucket_settings')
export class BucketSettings {
  @PrimaryColumn({ name: 'bucket_id', type: 'uuid' })
  bucketId!: string;

  @Column({ name: 'message_body_max_length', type: 'int', nullable: false })
  messageBodyMaxLength!: number;

  @Column({
    name: 'preferred_currency',
    type: 'varchar',
    length: SHORT_TEXT_MAX_LENGTH,
    nullable: false,
  })
  preferredCurrency!: string;

  @Column({ name: 'minimum_message_amount_minor', type: 'int', nullable: false })
  minimumMessageAmountMinor!: number;

  @OneToOne('Bucket', (b: Bucket) => b.settings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bucket_id' })
  bucket!: Bucket;
}
