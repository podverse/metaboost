import type {
  CreateManagementAdminRoleBody,
  UpdateManagementAdminRoleBody,
} from '../schemas/admins.js';
import type { ManagementAdminRole } from '@boilerplate/management-orm';
import type { Request, Response } from 'express';

import {
  getPredefinedManagementAdminRoleById,
  PREDEFINED_MANAGEMENT_ADMIN_ROLES,
} from '@boilerplate/helpers';
import { ManagementAdminRoleService } from '@boilerplate/management-orm';

function predefinedRoleToJson(role: (typeof PREDEFINED_MANAGEMENT_ADMIN_ROLES)[number]) {
  return {
    id: role.id,
    nameKey: role.nameKey,
    adminsCrud: role.adminsCrud,
    usersCrud: role.usersCrud,
    bucketsCrud: role.bucketsCrud,
    bucketMessagesCrud: role.bucketMessagesCrud,
    bucketAdminsCrud: role.bucketAdminsCrud,
    eventVisibility: role.eventVisibility,
    isPredefined: true as const,
    createdAt: null as string | null,
  };
}

function customRoleToJson(role: ManagementAdminRole) {
  return {
    id: role.id,
    name: role.name,
    adminsCrud: role.adminsCrud,
    usersCrud: role.usersCrud,
    bucketsCrud: role.bucketsCrud,
    bucketMessagesCrud: role.bucketMessagesCrud,
    bucketAdminsCrud: role.bucketAdminsCrud,
    eventVisibility: role.eventVisibility,
    isPredefined: false as const,
    createdAt:
      role.createdAt !== null && role.createdAt !== undefined ? role.createdAt.toISOString() : null,
  };
}

export async function listManagementAdminRoles(_req: Request, res: Response): Promise<void> {
  const customRoles = await ManagementAdminRoleService.listAll();
  const predefined = PREDEFINED_MANAGEMENT_ADMIN_ROLES.map(predefinedRoleToJson);
  res.status(200).json({ roles: [...predefined, ...customRoles.map(customRoleToJson)] });
}

export async function createManagementAdminRole(req: Request, res: Response): Promise<void> {
  const body = req.body as CreateManagementAdminRoleBody;
  const role = await ManagementAdminRoleService.create({
    name: body.name.trim(),
    adminsCrud: body.adminsCrud,
    usersCrud: body.usersCrud,
    bucketsCrud: body.bucketsCrud,
    bucketMessagesCrud: body.bucketMessagesCrud,
    bucketAdminsCrud: body.bucketAdminsCrud,
    eventVisibility: body.eventVisibility,
  });
  res.status(201).json({ role: customRoleToJson(role) });
}

export async function updateManagementAdminRole(req: Request, res: Response): Promise<void> {
  const roleId = req.params.roleId as string;
  const existing = await ManagementAdminRoleService.findById(roleId);
  if (existing === null) {
    res.status(404).json({ message: 'Role not found' });
    return;
  }
  const body = req.body as UpdateManagementAdminRoleBody;
  const updates: {
    name?: string;
    adminsCrud?: number;
    usersCrud?: number;
    bucketsCrud?: number;
    bucketMessagesCrud?: number;
    bucketAdminsCrud?: number;
    eventVisibility?: 'own' | 'all_admins' | 'all';
  } = {};
  if (body.name !== undefined) updates.name = body.name.trim();
  if (body.adminsCrud !== undefined) updates.adminsCrud = body.adminsCrud;
  if (body.usersCrud !== undefined) updates.usersCrud = body.usersCrud;
  if (body.bucketsCrud !== undefined) updates.bucketsCrud = body.bucketsCrud;
  if (body.bucketMessagesCrud !== undefined) updates.bucketMessagesCrud = body.bucketMessagesCrud;
  if (body.bucketAdminsCrud !== undefined) updates.bucketAdminsCrud = body.bucketAdminsCrud;
  if (body.eventVisibility !== undefined) updates.eventVisibility = body.eventVisibility;
  if (Object.keys(updates).length > 0) {
    await ManagementAdminRoleService.update(roleId, updates);
  }
  const updated = await ManagementAdminRoleService.findById(roleId);
  if (updated === null) {
    res.status(500).json({ message: 'Failed to load updated role' });
    return;
  }
  res.status(200).json({ role: customRoleToJson(updated) });
}

export async function deleteManagementAdminRole(req: Request, res: Response): Promise<void> {
  const roleId = req.params.roleId as string;
  const existing = await ManagementAdminRoleService.findById(roleId);
  if (existing === null) {
    res.status(404).json({ message: 'Role not found' });
    return;
  }
  await ManagementAdminRoleService.delete(roleId);
  res.status(204).send();
}

export async function resolveManagementAdminRole(roleId: string): Promise<{
  adminsCrud: number;
  usersCrud: number;
  bucketsCrud: number;
  bucketMessagesCrud: number;
  bucketAdminsCrud: number;
  eventVisibility: 'own' | 'all_admins' | 'all';
} | null> {
  const predefined = getPredefinedManagementAdminRoleById(roleId);
  if (predefined !== undefined) {
    return {
      adminsCrud: predefined.adminsCrud,
      usersCrud: predefined.usersCrud,
      bucketsCrud: predefined.bucketsCrud,
      bucketMessagesCrud: predefined.bucketMessagesCrud,
      bucketAdminsCrud: predefined.bucketAdminsCrud,
      eventVisibility: predefined.eventVisibility,
    };
  }
  const custom = await ManagementAdminRoleService.findById(roleId);
  if (custom === null) return null;
  return {
    adminsCrud: custom.adminsCrud,
    usersCrud: custom.usersCrud,
    bucketsCrud: custom.bucketsCrud,
    bucketMessagesCrud: custom.bucketMessagesCrud,
    bucketAdminsCrud: custom.bucketAdminsCrud,
    eventVisibility: custom.eventVisibility,
  };
}
