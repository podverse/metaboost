import type { UserWithRelations } from '../types/UserWithRelations.js';

import { generateShortId } from '@metaboost/helpers';

import { appDataSourceRead, appDataSourceReadWrite } from '../data-source.js';
import { User } from '../entities/User.js';
import { UserBio } from '../entities/UserBio.js';
import { UserCredentials } from '../entities/UserCredentials.js';

const USER_RELATIONS = ['credentials', 'bio'] as const;

export class UserService {
  static async findById(id: string): Promise<UserWithRelations | null> {
    const repo = appDataSourceRead.getRepository(User);
    return repo.findOne({
      where: { id },
      relations: [...USER_RELATIONS],
    }) as Promise<UserWithRelations | null>;
  }

  static async findByShortId(shortId: string): Promise<UserWithRelations | null> {
    const repo = appDataSourceRead.getRepository(User);
    return repo.findOne({
      where: { shortId },
      relations: [...USER_RELATIONS],
    }) as Promise<UserWithRelations | null>;
  }

  static async findByEmail(email: string): Promise<UserWithRelations | null> {
    const credRepo = appDataSourceRead.getRepository(UserCredentials);
    const cred = await credRepo.findOne({ where: { email } });
    if (cred === null) return null;
    return this.findById(cred.userId) as Promise<UserWithRelations | null>;
  }

  static async findByUsername(username: string): Promise<UserWithRelations | null> {
    const credRepo = appDataSourceRead.getRepository(UserCredentials);
    const cred = await credRepo.findOne({ where: { username } });
    if (cred === null) return null;
    return this.findById(cred.userId) as Promise<UserWithRelations | null>;
  }

  /**
   * Resolve user by email or username (single identifier for login).
   */
  static async findByEmailOrUsername(identifier: string): Promise<UserWithRelations | null> {
    const byEmail = await this.findByEmail(identifier);
    if (byEmail !== null) return byEmail;
    return this.findByUsername(identifier);
  }

  /**
   * Create a user with credentials (and optionally bio) in a single transaction.
   * At least one of email or username must be set. For username-only users (e.g. set-password
   * flow), caller may pass a placeholder password hash until the user sets a password.
   * Retries on short_id unique violation (up to 5 attempts).
   */
  static async create(data: {
    email?: string | null;
    username?: string | null;
    password: string;
    displayName?: string | null;
    preferredCurrency?: string | null;
  }): Promise<UserWithRelations> {
    const hasEmail = data.email !== undefined && data.email !== null && data.email !== '';
    const hasUsername =
      data.username !== undefined && data.username !== null && data.username !== '';
    if (!hasEmail && !hasUsername) {
      throw new Error('UserService.create: at least one of email or username is required');
    }
    const maxRetries = 5;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const shortId = generateShortId();
      const qr = appDataSourceReadWrite.createQueryRunner();
      await qr.connect();
      try {
        await qr.startTransaction();
        const userRepo = qr.manager.getRepository(User);
        const credRepo = qr.manager.getRepository(UserCredentials);
        const bioRepo = qr.manager.getRepository(UserBio);

        const user = userRepo.create({
          shortId,
        });
        const savedUser = await userRepo.save(user);

        const cred = credRepo.create({
          userId: savedUser.id,
          email: data.email ?? null,
          username: data.username ?? null,
          passwordHash: data.password,
        });
        await credRepo.save(cred);

        const bio = bioRepo.create({
          userId: savedUser.id,
          displayName: data.displayName ?? null,
          preferredCurrency: data.preferredCurrency ?? null,
        });
        await bioRepo.save(bio);

        await qr.commitTransaction();
        const withRelations = await userRepo.findOne({
          where: { id: savedUser.id },
          relations: [...USER_RELATIONS],
        });
        if (withRelations !== null) return withRelations as UserWithRelations;
        throw new Error('User created but failed to load with relations');
      } catch (e) {
        await qr.rollbackTransaction();
        const isUniqueViolation =
          e !== null &&
          typeof e === 'object' &&
          'code' in e &&
          (e as { code: string }).code === '23505';
        if (!isUniqueViolation || attempt === maxRetries - 1) {
          throw e;
        }
      } finally {
        await qr.release();
      }
    }
    throw new Error('UserService.create: failed after retries');
  }

  static async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    const repo = appDataSourceReadWrite.getRepository(UserCredentials);
    await repo.update({ userId }, { passwordHash: hashedPassword });
  }

  static async setEmailVerifiedAt(userId: string): Promise<void> {
    const repo = appDataSourceReadWrite.getRepository(User);
    await repo.update(userId, { emailVerifiedAt: new Date() });
  }

  static async updateEmail(userId: string, newEmail: string | null): Promise<void> {
    const repo = appDataSourceReadWrite.getRepository(UserCredentials);
    await repo.update({ userId }, { email: newEmail });
  }

  static async updateUsername(userId: string, username: string | null): Promise<void> {
    const repo = appDataSourceReadWrite.getRepository(UserCredentials);
    await repo.update({ userId }, { username });
  }

  static async updateDisplayName(userId: string, displayName: string | null): Promise<void> {
    const repo = appDataSourceReadWrite.getRepository(UserBio);
    await repo.update({ userId }, { displayName });
  }

  static async updatePreferredCurrency(
    userId: string,
    preferredCurrency: string | null
  ): Promise<void> {
    const repo = appDataSourceReadWrite.getRepository(UserBio);
    await repo.update({ userId }, { preferredCurrency });
  }
}
