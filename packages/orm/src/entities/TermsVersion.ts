import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { TermsVersionContent } from './TermsVersionContent.js';

export type TermsVersionStatus = 'draft' | 'upcoming' | 'current' | 'deprecated';

@Entity('terms_version')
export class TermsVersion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'version_key', unique: true })
  versionKey!: string;

  @Column({ name: 'title' })
  title!: string;

  @Column({ name: 'content_hash' })
  contentHash!: string;

  @OneToOne(() => TermsVersionContent, (content: TermsVersionContent) => content.termsVersion, {
    cascade: true,
  })
  content!: TermsVersionContent;

  @Column({ name: 'announcement_starts_at', type: 'timestamp', nullable: true })
  announcementStartsAt!: Date | null;

  @Column({ name: 'enforcement_starts_at', type: 'timestamp' })
  enforcementStartsAt!: Date;

  @Column({ name: 'status' })
  status!: TermsVersionStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

export { TermsVersionContent } from './TermsVersionContent.js';
