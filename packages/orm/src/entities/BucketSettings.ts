import type { Bucket } from './Bucket.js';

import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';

@Entity('bucket_settings')
export class BucketSettings {
  @PrimaryColumn({ name: 'bucket_id', type: 'uuid' })
  bucketId!: string;

  @Column({ name: 'message_body_max_length', type: 'int', nullable: false })
  messageBodyMaxLength!: number;

  @Column({ name: 'minimum_message_usd_cents', type: 'int', nullable: false })
  minimumMessageUsdCents!: number;

  @OneToOne('Bucket', (b: Bucket) => b.settings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bucket_id' })
  bucket!: Bucket;
}
