import type { EventVisibility } from '../entities/AdminPermissions.js';

import { v4 as uuidv4 } from 'uuid';

import { managementDataSource } from '../data-source.js';
import { AdminPermissions } from '../entities/AdminPermissions.js';
import { ManagementUser } from '../entities/ManagementUser.js';
import { ManagementUserBio } from '../entities/ManagementUserBio.js';
import { ManagementUserCredentials } from '../entities/ManagementUserCredentials.js';

export type CreateAdminData = {
  username: string;
  passwordHash: string;
  displayName: string;
  createdBy: string;
  adminsCrud: number;
  usersCrud: number;
  bucketsCrud: number;
  bucketMessagesCrud: number;
  bucketAdminsCrud: number;
  eventVisibility: EventVisibility;
};

export type UpdateAdminData = {
  username?: string;
  displayName?: string;
  passwordHash?: string;
  adminsCrud?: number;
  usersCrud?: number;
  bucketsCrud?: number;
  bucketMessagesCrud?: number;
  bucketAdminsCrud?: number;
  eventVisibility?: EventVisibility;
};

export class ManagementUserService {
  static async findByUsername(username: string): Promise<ManagementUser | null> {
    const repo = managementDataSource.getRepository(ManagementUser);
    return repo.findOne({
      where: { credentials: { username } },
      relations: ['credentials', 'bio', 'permissions'],
    });
  }

  static async findByDisplayName(displayName: string): Promise<ManagementUser | null> {
    const repo = managementDataSource.getRepository(ManagementUser);
    return repo.findOne({
      where: { bio: { displayName } },
      relations: ['credentials', 'bio', 'permissions'],
    });
  }

  static async findSuperAdmin(): Promise<ManagementUser | null> {
    const repo = managementDataSource.getRepository(ManagementUser);
    return repo.findOne({
      where: { isSuperAdmin: true },
      relations: ['credentials', 'bio', 'permissions'],
    });
  }

  static async findById(id: string): Promise<ManagementUser | null> {
    const repo = managementDataSource.getRepository(ManagementUser);
    return repo.findOne({
      where: { id },
      relations: ['credentials', 'bio', 'permissions'],
    });
  }

  /** All management users that are not super admin (i.e. admins). */
  static async listAdmins(): Promise<ManagementUser[]> {
    const repo = managementDataSource.getRepository(ManagementUser);
    return repo.find({
      where: { isSuperAdmin: false },
      relations: ['credentials', 'bio', 'permissions'],
      order: { createdAt: 'ASC' },
    });
  }

  /** Allowed sort fields for listAdminsPaginated. */
  static readonly LIST_ADMINS_SORT_FIELDS = ['username', 'displayName', 'createdAt'] as const;

  /** Paginated list of all management users (super admin and admins) and total count. Optional ILIKE search over username and display_name. */
  static async listAdminsPaginated(
    limit: number,
    offset: number,
    search?: string,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
  ): Promise<{ admins: ManagementUser[]; total: number }> {
    const repo = managementDataSource.getRepository(ManagementUser);
    const searchTrim = search?.trim();
    const hasSearch = searchTrim !== undefined && searchTrim !== '';
    const orderBy =
      sortBy !== undefined &&
      (ManagementUserService.LIST_ADMINS_SORT_FIELDS as readonly string[]).includes(sortBy)
        ? sortBy
        : 'username';
    const orderDir: 'ASC' | 'DESC' =
      sortOrder === 'asc'
        ? 'ASC'
        : sortOrder === 'desc'
          ? 'DESC'
          : orderBy === 'createdAt'
            ? 'DESC'
            : 'ASC';

    if (!hasSearch) {
      if (orderBy === 'createdAt') {
        const [admins, total] = await repo.findAndCount({
          relations: ['credentials', 'bio', 'permissions'],
          order: { createdAt: orderDir },
          take: limit,
          skip: offset,
        });
        return { admins, total };
      }
      const qb = repo
        .createQueryBuilder('u')
        .leftJoinAndSelect('u.credentials', 'credentials')
        .leftJoinAndSelect('u.bio', 'bio')
        .leftJoinAndSelect('u.permissions', 'permissions')
        .take(limit)
        .skip(offset);
      if (orderBy === 'username') {
        qb.orderBy('credentials.username', orderDir);
      } else if (orderBy === 'displayName') {
        qb.orderBy('bio.displayName', orderDir);
      } else {
        qb.orderBy('u.createdAt', orderDir);
      }
      const [admins, total] = await qb.getManyAndCount();
      return { admins, total };
    }
    const qb = repo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.credentials', 'credentials')
      .leftJoinAndSelect('u.bio', 'bio')
      .leftJoinAndSelect('u.permissions', 'permissions')
      .where(
        '(credentials.username ILIKE :searchPattern OR bio.display_name ILIKE :searchPattern)',
        {
          searchPattern: `%${searchTrim}%`,
        }
      )
      .take(limit)
      .skip(offset);
    if (orderBy === 'username') {
      qb.orderBy('credentials.username', orderDir);
    } else if (orderBy === 'displayName') {
      qb.orderBy('bio.displayName', orderDir);
    } else {
      qb.orderBy('u.createdAt', orderDir);
    }
    const [admins, total] = await qb.getManyAndCount();
    return { admins, total };
  }

  /**
   * Create an admin (non–super-admin). Always creates management_user, credentials,
   * management_user_bio (display_name required), and admin_permissions in a single transaction.
   * Atomicity is enforced at the application layer; FK ON DELETE CASCADE on
   * management_user_credentials and management_user_bio handles cleanup when a management_user
   * row is deleted.
   */
  static async createAdmin(data: CreateAdminData): Promise<ManagementUser> {
    const qr = managementDataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const userRepo = qr.manager.getRepository(ManagementUser);
      const credRepo = qr.manager.getRepository(ManagementUserCredentials);
      const bioRepo = qr.manager.getRepository(ManagementUserBio);
      const permRepo = qr.manager.getRepository(AdminPermissions);

      const id = uuidv4();
      const user = userRepo.create({
        id,
        isSuperAdmin: false, // Only seed/migration can create super admin; API cannot.
        createdBy: data.createdBy,
      });
      await userRepo.save(user);

      const cred = credRepo.create({
        managementUserId: id,
        username: data.username,
        passwordHash: data.passwordHash,
      });
      await credRepo.save(cred);

      const bio = bioRepo.create({
        managementUserId: id,
        displayName: data.displayName,
      });
      await bioRepo.save(bio);

      const perm = permRepo.create({
        adminId: id,
        adminsCrud: data.adminsCrud,
        usersCrud: data.usersCrud,
        bucketsCrud: data.bucketsCrud,
        bucketMessagesCrud: data.bucketMessagesCrud,
        bucketAdminsCrud: data.bucketAdminsCrud,
        eventVisibility: data.eventVisibility,
      });
      await permRepo.save(perm);

      await qr.commitTransaction();
      const withRelations = await this.findById(id);
      if (withRelations !== null) return withRelations;
      throw new Error('Admin created but failed to load with relations');
    } catch (e) {
      await qr.rollbackTransaction();
      throw e;
    } finally {
      await qr.release();
    }
  }

  static async updateAdmin(id: string, data: UpdateAdminData): Promise<ManagementUser | null> {
    const existing = await this.findById(id);
    if (existing === null) return null;

    const qr = managementDataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      if (data.username !== undefined) {
        await qr.manager
          .getRepository(ManagementUserCredentials)
          .update({ managementUserId: id }, { username: data.username });
      }
      if (data.displayName !== undefined && data.displayName.trim() !== '') {
        await qr.manager
          .getRepository(ManagementUserBio)
          .update({ managementUserId: id }, { displayName: data.displayName.trim() });
      }
      if (data.passwordHash !== undefined) {
        await qr.manager
          .getRepository(ManagementUserCredentials)
          .update({ managementUserId: id }, { passwordHash: data.passwordHash });
      }
      const permRepo = qr.manager.getRepository(AdminPermissions);
      const perm = existing.permissions;
      const allowPermissionUpdates = !existing.isSuperAdmin && perm !== undefined && perm !== null;
      if (allowPermissionUpdates) {
        const updates: {
          adminsCrud?: number;
          usersCrud?: number;
          bucketsCrud?: number;
          bucketMessagesCrud?: number;
          bucketAdminsCrud?: number;
          eventVisibility?: EventVisibility;
        } = {};
        if (data.adminsCrud !== undefined) updates.adminsCrud = data.adminsCrud;
        if (data.usersCrud !== undefined) updates.usersCrud = data.usersCrud;
        if (data.bucketsCrud !== undefined) updates.bucketsCrud = data.bucketsCrud;
        if (data.bucketMessagesCrud !== undefined)
          updates.bucketMessagesCrud = data.bucketMessagesCrud;
        if (data.bucketAdminsCrud !== undefined) updates.bucketAdminsCrud = data.bucketAdminsCrud;
        if (data.eventVisibility !== undefined) updates.eventVisibility = data.eventVisibility;
        if (Object.keys(updates).length > 0) {
          await permRepo.update({ adminId: id }, updates);
        }
      }
      await qr.commitTransaction();
      return this.findById(id);
    } catch (e) {
      await qr.rollbackTransaction();
      throw e;
    } finally {
      await qr.release();
    }
  }

  static async deleteById(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (existing === null || existing.isSuperAdmin) return false; // Super admin is never deletable.
    const repo = managementDataSource.getRepository(ManagementUser);
    const result = await repo.delete(id);
    return (result.affected ?? 0) > 0;
  }

  static async updatePassword(managementUserId: string, passwordHash: string): Promise<void> {
    const repo = managementDataSource.getRepository(ManagementUserCredentials);
    await repo.update({ managementUserId }, { passwordHash });
  }

  /** Update the logged-in user's display name (for profile page). */
  static async updateDisplayName(managementUserId: string, displayName: string): Promise<void> {
    const repo = managementDataSource.getRepository(ManagementUserBio);
    await repo.update({ managementUserId }, { displayName: displayName.trim() });
  }

  /** Update the logged-in user's username (for profile page). */
  static async updateUsername(managementUserId: string, username: string): Promise<void> {
    const repo = managementDataSource.getRepository(ManagementUserCredentials);
    await repo.update({ managementUserId }, { username: username.trim() });
  }
}
