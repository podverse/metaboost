import { appDataSourceRead, appDataSourceReadWrite } from '../data-source.js';
import { UserTermsAcceptance } from '../entities/UserTermsAcceptance.js';
import { TermsVersionService } from './TermsVersionService.js';

export type UserTermsAcceptanceStatus = {
  acceptedAt: Date | null;
  acceptedTermsEnforcementStartsAt: Date | null;
  hasAcceptedLatestTerms: boolean;
};

export class UserTermsAcceptanceService {
  static async findByUserId(userId: string): Promise<UserTermsAcceptance | null> {
    const repo = appDataSourceRead.getRepository(UserTermsAcceptance);
    return repo.findOne({
      where: { userId },
      relations: ['termsVersion', 'termsVersion.content'],
      order: { acceptedAt: 'DESC' },
    });
  }

  static async findByUserIdAndTermsVersionId(
    userId: string,
    termsVersionId: string
  ): Promise<UserTermsAcceptance | null> {
    const repo = appDataSourceRead.getRepository(UserTermsAcceptance);
    return repo.findOne({
      where: { userId, termsVersionId },
      relations: ['termsVersion', 'termsVersion.content'],
    });
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
    acceptedTermsEnforcementStartsAt: Date,
    acceptedAt: Date = new Date()
  ): Promise<UserTermsAcceptance> {
    const termsVersion =
      (await TermsVersionService.findByEnforcementStartsAt(acceptedTermsEnforcementStartsAt)) ??
      (await TermsVersionService.createLegacyVersionForEnforcementStartsAt(
        acceptedTermsEnforcementStartsAt
      ));
    return this.recordAcceptanceForVersion(userId, termsVersion.id, { acceptedAt });
  }

  static async hasAcceptedLatestTerms(
    userId: string,
    latestTermsEnforcementStartsAt: Date
  ): Promise<boolean> {
    const repo = appDataSourceRead.getRepository(UserTermsAcceptance);
    const acceptance = await repo
      .createQueryBuilder('acceptance')
      .innerJoinAndSelect('acceptance.termsVersion', 'termsVersion')
      .where('acceptance.userId = :userId', { userId })
      .andWhere('termsVersion.enforcementStartsAt >= :latestTermsEnforcementStartsAt', {
        latestTermsEnforcementStartsAt,
      })
      .orderBy('termsVersion.enforcementStartsAt', 'DESC')
      .getOne();

    return acceptance !== null;
  }

  static async getStatusForLatest(
    userId: string,
    latestTermsEnforcementStartsAt: Date
  ): Promise<UserTermsAcceptanceStatus> {
    const repo = appDataSourceRead.getRepository(UserTermsAcceptance);
    const acceptance = await repo
      .createQueryBuilder('acceptance')
      .innerJoinAndSelect('acceptance.termsVersion', 'termsVersion')
      .where('acceptance.userId = :userId', { userId })
      .orderBy('termsVersion.enforcementStartsAt', 'DESC')
      .addOrderBy('acceptance.acceptedAt', 'DESC')
      .getOne();
    if (acceptance === null) {
      return {
        acceptedAt: null,
        acceptedTermsEnforcementStartsAt: null,
        hasAcceptedLatestTerms: false,
      };
    }

    const acceptedTermsEnforcementStartsAt = acceptance.termsVersion.enforcementStartsAt;

    return {
      acceptedAt: acceptance.acceptedAt,
      acceptedTermsEnforcementStartsAt,
      hasAcceptedLatestTerms:
        acceptedTermsEnforcementStartsAt.getTime() >= latestTermsEnforcementStartsAt.getTime(),
    };
  }
}
