import type { User } from './User.js';

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { SHORT_TEXT_MAX_LENGTH } from '@metaboost/helpers';

@Entity('user_web_push_subscription')
export class UserWebPushSubscription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ type: 'varchar', length: 2048 })
  endpoint!: string;

  @Column({ name: 'key_p256dh', type: 'text' })
  keyP256dh!: string;

  @Column({ name: 'key_auth', type: 'text' })
  keyAuth!: string;

  @Column({ type: 'varchar', length: SHORT_TEXT_MAX_LENGTH, nullable: true })
  locale!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
