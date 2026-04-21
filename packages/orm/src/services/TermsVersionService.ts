import { appDataSourceRead, appDataSourceReadWrite } from '../data-source.js';
import {
  DEFAULT_STARTUP_ENFORCEMENT_AT_ISO,
  DEFAULT_TERMS_LOCALIZED_CONTENT,
  DEFAULT_TERMS_TITLE,
  DEFAULT_TERMS_VERSION_KEY,
  type TermsDefaultLocalizedContent,
} from '../defaults/termsDefaultContent.js';
import { TermsVersion, TermsVersionContent } from '../entities/TermsVersion.js';
import { computeTermsContentHash } from '../termsContentHash.js';

const TERMS_VERSION_RELATIONS = {
  content: true,
} as const;

type EnsureTermsVersionStartupOptions = {
  defaultEnforcementStartsAt?: Date;
  defaultVersionKey?: string;
  defaultTitle?: string;
  defaultLocalizedContent?: TermsDefaultLocalizedContent;
};

export type TermsVersionRolloverResult = {
  didRollover: boolean;
  currentVersionId: string | null;
};

export class TermsVersionService {
  static async findById(id: string): Promise<TermsVersion | null> {
    const repo = appDataSourceRead.getRepository(TermsVersion);
    return repo.findOne({ where: { id }, relations: TERMS_VERSION_RELATIONS });
  }

  static async findByVersionKey(versionKey: string): Promise<TermsVersion | null> {
    const repo = appDataSourceRead.getRepository(TermsVersion);
    return repo.findOne({ where: { versionKey }, relations: TERMS_VERSION_RELATIONS });
  }

  static async findByEnforcementStartsAt(enforcementStartsAt: Date): Promise<TermsVersion | null> {
    const repo = appDataSourceRead.getRepository(TermsVersion);
    return repo.findOne({
      where: { enforcementStartsAt },
      relations: TERMS_VERSION_RELATIONS,
    });
  }

  static async findCurrent(): Promise<TermsVersion | null> {
    const repo = appDataSourceRead.getRepository(TermsVersion);
    return repo.findOne({ where: { status: 'current' }, relations: TERMS_VERSION_RELATIONS });
  }

  static async findUpcoming(referenceDate: Date = new Date()): Promise<TermsVersion | null> {
    const repo = appDataSourceRead.getRepository(TermsVersion);
    return repo
      .createQueryBuilder('termsVersion')
      .leftJoinAndSelect('termsVersion.content', 'content')
      .where('termsVersion.status = :status', { status: 'upcoming' })
      .andWhere('termsVersion.enforcementStartsAt >= :referenceDate', { referenceDate })
      .orderBy('termsVersion.enforcementStartsAt', 'ASC')
      .getOne();
  }

  static async findCurrentOrUpcoming(
    referenceDate: Date = new Date()
  ): Promise<TermsVersion | null> {
    const current = await this.findCurrent();
    if (current !== null) {
      return current;
    }
    return this.findUpcoming(referenceDate);
  }

  /**
   * Promote overdue upcoming terms to current and deprecate the previous current version.
   * Runs transactionally so concurrent auth/me requests cannot double-promote.
   */
  static async rolloverIfEnforcementPassed(
    referenceDate: Date = new Date()
  ): Promise<TermsVersionRolloverResult> {
    return appDataSourceReadWrite.transaction(async (manager) => {
      const termsRepo = manager.getRepository(TermsVersion);
      const overdueUpcoming = await termsRepo
        .createQueryBuilder('termsVersion')
        .setLock('pessimistic_write')
        .where('termsVersion.status = :status', { status: 'upcoming' })
        .andWhere('termsVersion.enforcementStartsAt <= :referenceDate', { referenceDate })
        .orderBy('termsVersion.enforcementStartsAt', 'ASC')
        .addOrderBy('termsVersion.createdAt', 'ASC')
        .getOne();

      if (overdueUpcoming === null) {
        const current = await termsRepo
          .createQueryBuilder('termsVersion')
          .setLock('pessimistic_read')
          .where('termsVersion.status = :status', { status: 'current' })
          .getOne();
        return {
          didRollover: false,
          currentVersionId: current?.id ?? null,
        };
      }

      const current = await termsRepo
        .createQueryBuilder('termsVersion')
        .setLock('pessimistic_write')
        .where('termsVersion.status = :status', { status: 'current' })
        .getOne();

      if (current !== null && current.id !== overdueUpcoming.id) {
        await termsRepo
          .createQueryBuilder()
          .update(TermsVersion)
          .set({ status: 'deprecated' })
          .where('id = :id', { id: current.id })
          .execute();
      }

      await termsRepo
        .createQueryBuilder()
        .update(TermsVersion)
        .set({ status: 'current' })
        .where('id = :id', { id: overdueUpcoming.id })
        .execute();

      return {
        didRollover: true,
        currentVersionId: overdueUpcoming.id,
      };
    });
  }

  /**
   * Acceptable target for terms acceptance: prefer upcoming when present and pending, else current.
   */
  static async findActionableAcceptanceTarget(
    referenceDate: Date = new Date()
  ): Promise<TermsVersion | null> {
    const upcoming = await this.findUpcoming(referenceDate);
    if (upcoming !== null) {
      return upcoming;
    }
    return this.findCurrent();
  }

  /**
   * Ensures startup has a current/upcoming terms row. If the table is empty on first boot,
   * create a default current version with localized content.
   */
  static async assertConfiguredForStartup(
    referenceDate: Date = new Date(),
    options: EnsureTermsVersionStartupOptions = {}
  ): Promise<void> {
    const existing = await this.findCurrentOrUpcoming(referenceDate);
    if (existing !== null) {
      return;
    }

    const readRepo = appDataSourceRead.getRepository(TermsVersion);
    const existingCount = await readRepo.count();
    if (existingCount > 0) {
      throw new Error(
        'FATAL: terms_version rows exist but no current or upcoming version is available. Repair lifecycle states before starting this process.'
      );
    }

    const defaultEnforcementStartsAt =
      options.defaultEnforcementStartsAt ?? new Date(DEFAULT_STARTUP_ENFORCEMENT_AT_ISO);
    if (Number.isNaN(defaultEnforcementStartsAt.getTime())) {
      throw new Error('FATAL: Invalid default enforcementStartsAt for startup terms bootstrap.');
    }
    const localizedContent = options.defaultLocalizedContent ?? DEFAULT_TERMS_LOCALIZED_CONTENT;
    const versionKey = options.defaultVersionKey ?? DEFAULT_TERMS_VERSION_KEY;
    const title = options.defaultTitle ?? DEFAULT_TERMS_TITLE;

    const writeRepo = appDataSourceReadWrite.getRepository(TermsVersion);
    const contentRepo = appDataSourceReadWrite.getRepository(TermsVersionContent);
    const createdVersion = await writeRepo.save(
      writeRepo.create({
        versionKey,
        title,
        contentHash: computeTermsContentHash(localizedContent.enUS, localizedContent.es),
        announcementStartsAt: null,
        enforcementStartsAt: defaultEnforcementStartsAt,
        status: 'current',
      })
    );
    await contentRepo.save(
      contentRepo.create({
        termsVersionId: createdVersion.id,
        contentTextEnUs: localizedContent.enUS,
        contentTextEs: localizedContent.es,
      })
    );

    const termsVersion = await this.findCurrentOrUpcoming(referenceDate);
    if (termsVersion === null) {
      throw new Error('FATAL: Failed to bootstrap default terms_version row during startup.');
    }
  }

  static async findCurrentOrThrow(referenceDate: Date = new Date()): Promise<TermsVersion> {
    const termsVersion = await this.findCurrentOrUpcoming(referenceDate);
    if (termsVersion === null) {
      throw new Error('No current or upcoming terms version found.');
    }
    return termsVersion;
  }

  static async createLegacyVersionForEnforcementStartsAt(
    enforcementStartsAt: Date
  ): Promise<TermsVersion> {
    const existing = await this.findByEnforcementStartsAt(enforcementStartsAt);
    if (existing !== null) {
      return existing;
    }

    const termsRepo = appDataSourceReadWrite.getRepository(TermsVersion);
    const contentRepo = appDataSourceReadWrite.getRepository(TermsVersionContent);
    const iso = enforcementStartsAt.toISOString();
    const legacy = termsRepo.create({
      versionKey: `legacy-${iso}`,
      title: 'Legacy Terms Version',
      contentHash: `legacy-${iso}`,
      announcementStartsAt: null,
      enforcementStartsAt,
      status: 'deprecated',
    });
    const saved = await termsRepo.save(legacy);
    await contentRepo.save(
      contentRepo.create({
        termsVersionId: saved.id,
        contentTextEnUs: 'Legacy terms placeholder',
        contentTextEs: 'Marcador de posición de términos heredados',
      })
    );
    const withContent = await this.findById(saved.id);
    if (withContent === null) {
      throw new Error('Failed to load legacy terms version after creation.');
    }
    return withContent;
  }

  static getLocalizedContent(termsVersion: TermsVersion, locale: string): string {
    const content = termsVersion.content;
    if (locale === 'es') {
      return content.contentTextEs;
    }
    return content.contentTextEnUs;
  }
}
