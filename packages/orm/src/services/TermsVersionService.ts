import { appDataSourceRead, appDataSourceReadWrite } from '../data-source.js';
import { TermsVersion } from '../entities/TermsVersion.js';

export class TermsVersionService {
  static async findById(id: string): Promise<TermsVersion | null> {
    const repo = appDataSourceRead.getRepository(TermsVersion);
    return repo.findOne({ where: { id } });
  }

  static async findByVersionKey(versionKey: string): Promise<TermsVersion | null> {
    const repo = appDataSourceRead.getRepository(TermsVersion);
    return repo.findOne({ where: { versionKey } });
  }

  static async findByEffectiveAt(effectiveAt: Date): Promise<TermsVersion | null> {
    const repo = appDataSourceRead.getRepository(TermsVersion);
    return repo.findOne({ where: { effectiveAt } });
  }

  static async findActive(): Promise<TermsVersion | null> {
    const repo = appDataSourceRead.getRepository(TermsVersion);
    return repo.findOne({ where: { status: 'active' } });
  }

  static async findNextScheduled(referenceDate: Date = new Date()): Promise<TermsVersion | null> {
    const repo = appDataSourceRead.getRepository(TermsVersion);
    return repo
      .createQueryBuilder('termsVersion')
      .where('termsVersion.status = :status', { status: 'scheduled' })
      .andWhere('termsVersion.effectiveAt >= :referenceDate', { referenceDate })
      .orderBy('termsVersion.effectiveAt', 'ASC')
      .getOne();
  }

  static async findCurrentOrNext(referenceDate: Date = new Date()): Promise<TermsVersion | null> {
    const active = await this.findActive();
    if (active !== null) {
      return active;
    }
    return this.findNextScheduled(referenceDate);
  }

  static async findCurrentOrThrow(referenceDate: Date = new Date()): Promise<TermsVersion> {
    const termsVersion = await this.findCurrentOrNext(referenceDate);
    if (termsVersion === null) {
      throw new Error('No active or scheduled terms version found.');
    }
    return termsVersion;
  }

  static async createLegacyVersionForEffectiveAt(effectiveAt: Date): Promise<TermsVersion> {
    const existing = await this.findByEffectiveAt(effectiveAt);
    if (existing !== null) {
      return existing;
    }

    const repo = appDataSourceReadWrite.getRepository(TermsVersion);
    const iso = effectiveAt.toISOString();
    const legacy = repo.create({
      versionKey: `legacy-${iso}`,
      title: 'Legacy Terms Version',
      contentHash: `legacy-${iso}`,
      announcementStartsAt: null,
      effectiveAt,
      enforcementStartsAt: effectiveAt,
      status: 'retired',
    });
    return repo.save(legacy);
  }
}
