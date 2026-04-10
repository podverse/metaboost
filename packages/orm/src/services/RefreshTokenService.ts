import type { User } from '../entities/User.js';

import { appDataSourceReadWrite } from '../data-source.js';
import { RefreshToken } from '../entities/RefreshToken.js';

export class RefreshTokenService {
  static async createToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date
  ): Promise<RefreshToken> {
    const repo = appDataSourceReadWrite.getRepository(RefreshToken);
    const token = repo.create({ userId, tokenHash, expiresAt });
    return repo.save(token);
  }

  /**
   * Find refresh token by hash, verify not expired, delete it (rotation), return user.
   * Returns null if not found or expired.
   */
  static async consumeToken(tokenHash: string): Promise<User | null> {
    const repo = appDataSourceReadWrite.getRepository(RefreshToken);
    const token = await repo.findOne({
      where: { tokenHash },
      relations: ['user', 'user.credentials'],
    });
    if (token === null) return null;
    if (token.expiresAt < new Date()) {
      await repo.remove(token);
      return null;
    }

    const user = token.user;
    await repo.remove(token);
    return user;
  }

  /**
   * Delete refresh token by hash (e.g. on logout when we have the cookie).
   */
  static async revokeByTokenHash(tokenHash: string): Promise<void> {
    const repo = appDataSourceReadWrite.getRepository(RefreshToken);
    await repo.delete({ tokenHash });
  }

  /**
   * Revoke all refresh tokens for a user (e.g. on logout all / security).
   */
  static async revokeAllForUser(userId: string): Promise<void> {
    const repo = appDataSourceReadWrite.getRepository(RefreshToken);
    await repo.delete({ userId });
  }
}
