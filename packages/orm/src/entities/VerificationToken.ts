import type { User } from './User.js';

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

import { TOKEN_HASH_HEX_LENGTH, VERIFICATION_TOKEN_KIND_MAX_LENGTH } from '../constants.js';

@Entity('verification_token')
export class VerificationToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'kind', type: 'varchar', length: VERIFICATION_TOKEN_KIND_MAX_LENGTH })
  kind!: string;

  @Column({ name: 'token_hash', type: 'varchar', length: TOKEN_HASH_HEX_LENGTH })
  tokenHash!: string;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt!: Date;

  @Column({ name: 'payload', type: 'jsonb', nullable: true })
  payload!: Record<string, unknown> | null;

  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
