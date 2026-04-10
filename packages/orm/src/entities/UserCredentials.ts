import type { User } from './User.js';

import { Entity, Column, PrimaryColumn, OneToOne, JoinColumn } from 'typeorm';

import { EMAIL_MAX_LENGTH, PASSWORD_HASH_LENGTH, USERNAME_MAX_LENGTH } from '@boilerplate/helpers';

@Entity('user_credentials')
export class UserCredentials {
  @PrimaryColumn('uuid', { name: 'user_id' })
  userId!: string;

  @Column({
    type: 'varchar',
    length: EMAIL_MAX_LENGTH,
    unique: true,
    nullable: true,
  })
  email!: string | null;

  @Column({
    type: 'varchar',
    length: USERNAME_MAX_LENGTH,
    unique: true,
    nullable: true,
  })
  username!: string | null;

  @Column({ name: 'password_hash', type: 'varchar', length: PASSWORD_HASH_LENGTH })
  passwordHash!: string;

  @OneToOne('User', (u: User) => u.credentials, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
