import { appDataSourceRead, appDataSourceReadWrite } from '../data-source.js';
import { UserTermsAcceptance } from '../entities/UserTermsAcceptance.js';
import { TermsVersionService } from './TermsVersionService.js';

export type UserTermsAcceptanceStatus = {
  acceptedAt: Date | null;
  acceptedTermsEffectiveAt: Date | null;
  hasAcceptedLatestTerms: boolean;
};

export class UserTermsAcceptanceService {
  static async findByUserId(userId: string): Promise<UserTermsAcceptance | null> {
    const repo = appDataSourceRead.getRepository(UserTermsAcceptance);
    return repo.findOne({
      where: { userId },
      relations: ['termsVersion'],
      order: { acceptedAt: 'DESC' },
    });
  }

  static async findByUserIdAndTermsVersionId(
    userId: string,
    termsVersionId: string
  ): Promise<UserTermsAcceptance | null> {
    const repo = appDataSourceRead.getRepository(UserTermsAcceptance);
    return repo.findOne({ where: { userId, termsVersionId }, relations: ['termsVersion'] });
  }

  static async recordAcceptanceForVersion(
    userId: string,
    termsVersionId: string,
    options?: { acceptanceSource?: string; acceptedAt?: Date }
  ): Promise<UserTermsAcceptance> {
    const acceptedAt = options?.acceptedAt ?? new Date();
    const acceptanceSource = options?.acceptanceSource ?? null;
    const existing = await this.findByUserIdAndTermsVersionId(userId, termsVersionId);
    if (existing !== null) {
      return existing;
    }

    const repo = appDataSourceReadWrite.getRepository(UserTermsAcceptance);
    const entity = repo.create({
      userId,
      termsVersionId,
      acceptedAt,
      acceptanceSource,
    });
    return repo.save(entity);
  }

  static async recordAcceptanceForCurrentVersion(
    userId: string,
    options?: { acceptanceSource?: string; acceptedAt?: Date; referenceDate?: Date }
  ): Promise<UserTermsAcceptance> {
    const termsVersion = await TermsVersionService.findCurrentOrThrow(options?.referenceDate);
    return this.recordAcceptanceForVersion(userId, termsVersion.id, options);
  }

  static async upsertAcceptance(
    userId: string,
    acceptedTermsEffectiveAt: Date,
    acceptedAt: Date = new Date()
  ): Promise<UserTermsAcceptance> {
    const termsVersion =
      (await TermsVersionService.findByEffectiveAt(acceptedTermsEffectiveAt)) ??
      (await TermsVersionService.createLegacyVersionForEffectiveAt(acceptedTermsEffectiveAt));
    return this.recordAcceptanceForVersion(userId, termsVersion.id, { acceptedAt });
  }

  static async hasAcceptedLatestTerms(
    userId: string,
    latestTermsEffectiveAt: Date
  ): Promise<boolean> {
    const repo = appDataSourceRead.getRepository(UserTermsAcceptance);
    const acceptance = await repo
      .createQueryBuilder('acceptance')
      .innerJoinAndSelect('acceptance.termsVersion', 'termsVersion')
      .where('acceptance.userId = :userId', { userId })
      .andWhere('termsVersion.effectiveAt >= :latestTermsEffectiveAt', { latestTermsEffectiveAt })
      .orderBy('termsVersion.effectiveAt', 'DESC')
      .getOne();

    return acceptance !== null;
  }

  static async getStatusForLatest(
    userId: string,
    latestTermsEffectiveAt: Date
  ): Promise<UserTermsAcceptanceStatus> {
    const repo = appDataSourceRead.getRepository(UserTermsAcceptance);
    const acceptance = await repo
      .createQueryBuilder('acceptance')
      .innerJoinAndSelect('acceptance.termsVersion', 'termsVersion')
      .where('acceptance.userId = :userId', { userId })
      .orderBy('termsVersion.effectiveAt', 'DESC')
      .addOrderBy('acceptance.acceptedAt', 'DESC')
      .getOne();
    if (acceptance === null) {
      return {
        acceptedAt: null,
        acceptedTermsEffectiveAt: null,
        hasAcceptedLatestTerms: false,
      };
    }

    const acceptedTermsEffectiveAt = acceptance.termsVersion.effectiveAt;

    return {
      acceptedAt: acceptance.acceptedAt,
      acceptedTermsEffectiveAt,
      hasAcceptedLatestTerms:
        acceptedTermsEffectiveAt.getTime() >= latestTermsEffectiveAt.getTime(),
    };
  }
}
