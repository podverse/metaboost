import type { ChangePasswordBody, CreateAdminBody, UpdateAdminBody } from '../schemas/admins.js';
import type { Request, Response } from 'express';

import {
  DEFAULT_PAGE_LIMIT,
  MAX_PAGE_SIZE,
  MAX_TOTAL_CAP,
  parseSortOrderQueryParam,
} from '@metaboost/helpers';
import {
  EVENT_ACTIONS,
  EVENT_TARGET_TYPES,
  ManagementEventService,
  ManagementUserService,
} from '@metaboost/management-orm';

import { hashPassword } from '../lib/auth/hash.js';
import { managementUserToJson } from '../lib/managementUserToJson.js';
import { recordEvent } from '../lib/recordEvent.js';
import { resolveManagementAdminRole } from './adminRolesController.js';

/**
 * All admin responses use managementUserToJson only. Never return req.managementUser or
 * admin.credentials; passwordHash must not appear in any response (see CREDENTIALS-PROTECTION.md).
 */
export async function listAdmins(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(req.query.limit) || DEFAULT_PAGE_LIMIT));
  const searchRaw = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;
  const search = searchRaw === '' ? undefined : searchRaw;
  const sortByRaw = typeof req.query.sortBy === 'string' ? req.query.sortBy.trim() : undefined;
  const sortBy = sortByRaw === '' ? undefined : sortByRaw;
  const sortOrder = parseSortOrderQueryParam(req.query.sortOrder);
  const offset = (page - 1) * limit;
  const { admins, total } = await ManagementUserService.listAdminsPaginated(
    limit,
    offset,
    search,
    sortBy,
    sortOrder
  );
  const cappedTotal = total > MAX_TOTAL_CAP ? MAX_TOTAL_CAP : total;
  const totalPages = Math.max(1, Math.ceil(cappedTotal / limit));
  const truncatedTotal = total > MAX_TOTAL_CAP;
  res.status(200).json({
    admins: admins.map(managementUserToJson),
    total: cappedTotal,
    page,
    limit,
    totalPages,
    ...(truncatedTotal && { truncatedTotal: true }),
  });
}

export async function getAdmin(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const admin = await ManagementUserService.findById(id);
  if (admin === null) {
    res.status(404).json({ message: 'Admin not found' });
    return;
  }
  res.status(200).json({ admin: managementUserToJson(admin) });
}

export async function createAdmin(req: Request, res: Response): Promise<void> {
  const actor = req.managementUser;
  if (actor === undefined) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  const body = req.body as CreateAdminBody;
  const rolePermissions =
    body.roleId !== undefined ? await resolveManagementAdminRole(body.roleId) : null;
  if (body.roleId !== undefined && rolePermissions === null) {
    res.status(404).json({ message: 'Role not found' });
    return;
  }

  const existingByUsername = await ManagementUserService.findByUsername(body.username);
  if (existingByUsername !== null) {
    res.status(409).json({ message: 'Username already in use' });
    return;
  }
  const existingByDisplayName = await ManagementUserService.findByDisplayName(
    body.displayName.trim()
  );
  if (existingByDisplayName !== null) {
    res.status(409).json({ message: 'Display name already in use' });
    return;
  }

  const passwordHash = await hashPassword(body.password);
  // createAdmin always creates a non–super-admin; super admin cannot be created via API.
  const admin = await ManagementUserService.createAdmin({
    username: body.username,
    passwordHash,
    displayName: body.displayName.trim(),
    createdBy: actor.id,
    adminsCrud: rolePermissions?.adminsCrud ?? body.adminsCrud,
    usersCrud: rolePermissions?.usersCrud ?? body.usersCrud,
    bucketsCrud: rolePermissions?.bucketsCrud ?? body.bucketsCrud,
    bucketMessagesCrud: rolePermissions?.bucketMessagesCrud ?? body.bucketMessagesCrud,
    bucketAdminsCrud: rolePermissions?.bucketAdminsCrud ?? body.bucketAdminsCrud,
    eventVisibility: rolePermissions?.eventVisibility ?? body.eventVisibility,
  });
  await recordEvent({
    actor,
    action: EVENT_ACTIONS.admin.created,
    targetType: EVENT_TARGET_TYPES.admin,
    targetId: admin.id,
    details: body.username,
  });
  res.status(201).json({ admin: managementUserToJson(admin) });
}

export async function updateAdmin(req: Request, res: Response): Promise<void> {
  const actor = req.managementUser;
  if (actor === undefined) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  const id = req.params.id as string;
  const admin = await ManagementUserService.findById(id);
  if (admin === null) {
    res.status(404).json({ message: 'Admin not found' });
    return;
  }
  // Only the super admin can update their own record; no other admin can update the super admin.
  if (admin.isSuperAdmin && actor.id !== id) {
    res.status(404).json({ message: 'Admin not found' });
    return;
  }

  const body = req.body as UpdateAdminBody;
  const rolePermissions =
    body.roleId !== undefined ? await resolveManagementAdminRole(body.roleId) : null;
  if (body.roleId !== undefined && rolePermissions === null) {
    res.status(404).json({ message: 'Role not found' });
    return;
  }
  if (body.username !== undefined) {
    const other = await ManagementUserService.findByUsername(body.username.trim());
    if (other !== null && other.id !== id) {
      res.status(409).json({ message: 'Username already in use' });
      return;
    }
  }
  if (body.displayName !== undefined) {
    const other = await ManagementUserService.findByDisplayName(body.displayName.trim());
    if (other !== null && other.id !== id) {
      res.status(409).json({ message: 'Display name already in use' });
      return;
    }
  }
  const permissionKeys = [
    'roleId',
    'adminsCrud',
    'usersCrud',
    'bucketsCrud',
    'bucketMessagesCrud',
    'bucketAdminsCrud',
    'eventVisibility',
  ] as const;
  const hasPermissionUpdate = permissionKeys.some((k) => body[k] !== undefined);
  const isSuperAdminSelfUpdate = admin.isSuperAdmin && actor.id === id;
  const actorAdminsCrud = actor.permissions?.adminsCrud ?? 0;
  const canChangePermissions = actor.isSuperAdmin || (actorAdminsCrud & 5) !== 0; // create=1 | update=4
  if (hasPermissionUpdate && !canChangePermissions) {
    res
      .status(403)
      .json({ message: 'Create or update permission required to change admin permissions' });
    return;
  }
  if (hasPermissionUpdate && isSuperAdminSelfUpdate) {
    res.status(403).json({ message: 'Super admin permissions cannot be changed' });
    return;
  }
  const updates: Parameters<typeof ManagementUserService.updateAdmin>[1] = {};
  if (body.username !== undefined) updates.username = body.username.trim();
  if (body.displayName !== undefined) updates.displayName = body.displayName.trim();
  if (body.password !== undefined) updates.passwordHash = await hashPassword(body.password);
  if (!isSuperAdminSelfUpdate) {
    if (rolePermissions !== null) {
      updates.adminsCrud = rolePermissions.adminsCrud;
      updates.usersCrud = rolePermissions.usersCrud;
      updates.bucketsCrud = rolePermissions.bucketsCrud;
      updates.bucketMessagesCrud = rolePermissions.bucketMessagesCrud;
      updates.bucketAdminsCrud = rolePermissions.bucketAdminsCrud;
      updates.eventVisibility = rolePermissions.eventVisibility;
    } else {
      if (body.adminsCrud !== undefined) updates.adminsCrud = body.adminsCrud;
      if (body.usersCrud !== undefined) updates.usersCrud = body.usersCrud;
      if (body.bucketsCrud !== undefined) updates.bucketsCrud = body.bucketsCrud;
      if (body.bucketMessagesCrud !== undefined)
        updates.bucketMessagesCrud = body.bucketMessagesCrud;
      if (body.bucketAdminsCrud !== undefined) updates.bucketAdminsCrud = body.bucketAdminsCrud;
      if (body.eventVisibility !== undefined) updates.eventVisibility = body.eventVisibility;
    }
  }

  if (Object.keys(updates).length === 0) {
    res.status(200).json({ admin: managementUserToJson(admin) });
    return;
  }

  const updated = await ManagementUserService.updateAdmin(id, updates);
  if (updated !== null) {
    if (body.displayName !== undefined) {
      try {
        await ManagementEventService.updateActorDisplayName(id, body.displayName.trim());
      } catch (err) {
        // Non-critical: admin is already saved; log but do not roll back.
        console.error('Failed to update actor_display_name in events', err);
      }
    }
    await recordEvent({
      actor,
      action: EVENT_ACTIONS.admin.updated,
      targetType: EVENT_TARGET_TYPES.admin,
      targetId: id,
    });
    res.status(200).json({ admin: managementUserToJson(updated) });
  } else {
    res.status(404).json({ message: 'Admin not found' });
  }
}

export async function deleteAdmin(req: Request, res: Response): Promise<void> {
  const actor = req.managementUser;
  if (actor === undefined) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  const id = req.params.id as string;
  const admin = await ManagementUserService.findById(id);
  // No one can delete the super admin, regardless of delete permission.
  if (admin === null || admin.isSuperAdmin) {
    res.status(404).json({ message: 'Admin not found' });
    return;
  }
  const deleted = await ManagementUserService.deleteById(id);
  if (deleted) {
    await recordEvent({
      actor,
      action: EVENT_ACTIONS.admin.deleted,
      targetType: EVENT_TARGET_TYPES.admin,
      targetId: id,
      details: admin.credentials.username,
    });
    res.status(204).send();
  } else {
    res.status(404).json({ message: 'Admin not found' });
  }
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  const actor = req.managementUser;
  if (actor === undefined) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  const { currentPassword, newPassword } = req.body as ChangePasswordBody;
  const { comparePassword } = await import('../lib/auth/hash.js');
  const ok = await comparePassword(currentPassword, actor.credentials.passwordHash);
  if (!ok) {
    res.status(401).json({ message: 'Current password is incorrect' });
    return;
  }
  const hashed = await hashPassword(newPassword);
  await ManagementUserService.updatePassword(actor.id, hashed);
  await recordEvent({
    actor,
    action: EVENT_ACTIONS.admin.passwordChanged,
    targetType: EVENT_TARGET_TYPES.admin,
    targetId: actor.id,
  });
  res.status(204).send();
}
