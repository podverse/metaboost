import type { EventVisibility } from '../entities/AdminPermissions.js';

import { managementDataSource } from '../data-source.js';
import { ManagementAdminRole } from '../entities/ManagementAdminRole.js';

export type CreateManagementAdminRoleData = {
  name: string;
  adminsCrud: number;
  usersCrud: number;
  bucketsCrud: number;
  bucketMessagesCrud: number;
  bucketAdminsCrud: number;
  eventVisibility: EventVisibility;
};

export type UpdateManagementAdminRoleData = {
  name?: string;
  adminsCrud?: number;
  usersCrud?: number;
  bucketsCrud?: number;
  bucketMessagesCrud?: number;
  bucketAdminsCrud?: number;
  eventVisibility?: EventVisibility;
};

export class ManagementAdminRoleService {
  static async listAll(): Promise<ManagementAdminRole[]> {
    const repo = managementDataSource.getRepository(ManagementAdminRole);
    return repo.find({ order: { createdAt: 'ASC' } });
  }

  static async findById(id: string): Promise<ManagementAdminRole | null> {
    const repo = managementDataSource.getRepository(ManagementAdminRole);
    return repo.findOne({ where: { id } });
  }

  static async create(data: CreateManagementAdminRoleData): Promise<ManagementAdminRole> {
    const repo = managementDataSource.getRepository(ManagementAdminRole);
    const role = repo.create(data);
    return repo.save(role);
  }

  static async update(id: string, data: UpdateManagementAdminRoleData): Promise<void> {
    const repo = managementDataSource.getRepository(ManagementAdminRole);
    await repo.update(id, data);
  }

  static async delete(id: string): Promise<void> {
    const repo = managementDataSource.getRepository(ManagementAdminRole);
    await repo.delete(id);
  }
}
