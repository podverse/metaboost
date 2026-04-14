import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';

import { MEDIUM_TEXT_MAX_LENGTH, SHORT_TEXT_MAX_LENGTH } from '@metaboost/helpers';

import { BucketMessage } from './BucketMessage.js';

@Entity('bucket_message_app_meta')
export class BucketMessageAppMeta {
  @PrimaryColumn('uuid', { name: 'bucket_message_id' })
  bucketMessageId!: string;

  @Column({ name: 'app_name', type: 'varchar', length: SHORT_TEXT_MAX_LENGTH })
  appName!: string;

  @Column({ name: 'app_version', type: 'varchar', length: SHORT_TEXT_MAX_LENGTH, nullable: true })
  appVersion!: string | null;

  @Column({ name: 'sender_id', type: 'varchar', length: MEDIUM_TEXT_MAX_LENGTH, nullable: true })
  senderId!: string | null;

  @Column({ name: 'podcast_index_feed_id', type: 'integer', nullable: true })
  podcastIndexFeedId!: number | null;

  @Column({ name: 'time_position', type: 'numeric', nullable: true })
  timePosition!: string | null;

  @OneToOne(() => BucketMessage, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bucket_message_id' })
  message!: BucketMessage;
}
