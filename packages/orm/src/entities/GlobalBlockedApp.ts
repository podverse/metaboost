import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

import { MEDIUM_TEXT_MAX_LENGTH, SHORT_TEXT_MAX_LENGTH } from '@metaboost/helpers';

@Entity('global_blocked_app')
@Unique(['appId'])
export class GlobalBlockedApp {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'app_id', type: 'varchar', length: MEDIUM_TEXT_MAX_LENGTH })
  appId!: string;

  @Column({ name: 'note', type: 'varchar', length: SHORT_TEXT_MAX_LENGTH, nullable: true })
  note!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
