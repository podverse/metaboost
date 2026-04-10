import type { ManagementUser } from '../entities/ManagementUser.js';

import { managementDataSource } from '../data-source.js';
import { ManagementRefreshToken } from '../entities/ManagementRefreshToken.js';
import { ManagementUserService } from './ManagementUserService.js';

export class ManagementRefreshTokenService {
  static async createToken(
    managementUserId: string,
    tokenHash: string,
    expiresAt: Date
  ): Promise<ManagementRefreshToken> {
    const repo = managementDataSource.getRepository(ManagementRefreshToken);
    const token = repo.create({ managementUserId, tokenHash, expiresAt });
    return repo.save(token);
  }

  /**
   * Find refresh token by hash, verify not expired, delete it (rotation), return management user.
   * Returns null if not found or expired.
   */
  static async consumeToken(tokenHash: string): Promise<ManagementUser | null> {
    const repo = managementDataSource.getRepository(ManagementRefreshToken);
    const token = await repo.findOne({ where: { tokenHash } });
    if (token === null) return null;
    if (token.expiresAt < new Date()) {
      await repo.remove(token);
      return null;
    }

    const user = await ManagementUserService.findById(token.managementUserId);
    if (user === null) return null;

    await repo.remove(token);
    return user;
  }

  /**
   * Delete refresh token by hash (e.g. on logout when we have the cookie).
   */
  static async revokeByTokenHash(tokenHash: string): Promise<void> {
    const repo = managementDataSource.getRepository(ManagementRefreshToken);
    await repo.delete({ tokenHash });
  }

  /**
   * Revoke all refresh tokens for a management user.
   */
  static async revokeAllForUser(managementUserId: string): Promise<void> {
    const repo = managementDataSource.getRepository(ManagementRefreshToken);
    await repo.delete({ managementUserId });
  }
}
