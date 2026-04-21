import type { TermsVersion } from './TermsVersion.js';

import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';

@Entity('terms_version_content')
export class TermsVersionContent {
  @PrimaryColumn({ name: 'terms_version_id', type: 'uuid' })
  termsVersionId!: string;

  @OneToOne('TermsVersion', (termsVersion: TermsVersion) => termsVersion.content, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'terms_version_id' })
  termsVersion!: TermsVersion;

  @Column({ name: 'content_text_en_us', type: 'text' })
  contentTextEnUs!: string;

  @Column({ name: 'content_text_es', type: 'text' })
  contentTextEs!: string;
}
