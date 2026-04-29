import type { CreateBucketAdminBody, UpdateBucketAdminBody } from '../schemas/buckets.js';
import type { UserWithRelations } from '@metaboost/orm';
import type { Request, Response } from 'express';

import { CRUD_BITS } from '@metaboost/helpers';
import { BucketAdminService, UserService } from '@metaboost/orm';

import { normalizeBucketMessageCrud } from '../lib/bucket-admin-permissions.js';
import { getBucketContext } from '../lib/bucket-context.js';
import { canManageBucketAdmins } from '../lib/bucket-policy.js';
import { userToPublicSummary } from '../lib/userToJson.js';

/** Admin CRUD always includes read; enforce when serializing or persisting. */
const ADMIN_CRUD_READ = CRUD_BITS.read;

const ADMINS_ROOT_MESSAGE = 'Admins are managed on the root bucket only.';

/** Resolve user by idText or UUID. Prefers idText for URL/body params. */
async function resolveUser(idOrIdText: string): Promise<UserWithRelations | null> {
  const byShort = await UserService.findByIdText(idOrIdText);
  if (byShort !== null) return byShort;
  return UserService.findById(idOrIdText);
}

function bucketAdminToJson(
  bucketAdmin: {
    id: string;
    bucketId: string;
    userId: string;
    bucketCrud: number;
    bucketMessagesCrud: number;
    bucketAdminsCrud: number;
    createdAt: Date;
  },
  user: UserWithRelations | null
) {
  const bucketAdminsCrud = bucketAdmin.bucketAdminsCrud | ADMIN_CRUD_READ;
  return {
    id: bucketAdmin.id,
    bucketId: bucketAdmin.bucketId,
    userId: bucketAdmin.userId,
    bucketCrud: bucketAdmin.bucketCrud,
    bucketMessagesCrud: bucketAdmin.bucketMessagesCrud,
    bucketAdminsCrud,
    createdAt: bucketAdmin.createdAt,
    user: user !== null ? userToPublicSummary(user) : null,
  };
}

export async function listBucketAdmins(req: Request, res: Response): Promise<void> {
  const ctx = await getBucketContext(req, res, {
    paramKey: 'bucketId',
    can: canManageBucketAdmins,
  });
  if (ctx === null) return;
  const { effectiveBucket } = ctx.resolved;
  const bucketAdmins = await BucketAdminService.findByBucketId(effectiveBucket.id);
  const withUser = bucketAdmins.map((bucketAdmin) => {
    const u =
      bucketAdmin.user !== undefined &&
      bucketAdmin.user !== null &&
      'credentials' in bucketAdmin.user
        ? (bucketAdmin.user as UserWithRelations)
        : null;
    return bucketAdminToJson(bucketAdmin, u);
  });
  res.status(200).json({ admins: withUser });
}

/** GET /buckets/:bucketId/admins/:userId – get one admin (userId may be idText or UUID). */
export async function getBucketAdmin(req: Request, res: Response): Promise<void> {
  const ctx = await getBucketContext(req, res, {
    paramKey: 'bucketId',
    can: canManageBucketAdmins,
  });
  if (ctx === null) return;
  const userIdParam = req.params.userId as string;
  const { effectiveBucket } = ctx.resolved;
  const targetUser = await resolveUser(userIdParam);
  if (targetUser === null) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  if (targetUser.id === effectiveBucket.ownerId) {
    const fullCrud = CRUD_BITS.create | CRUD_BITS.read | CRUD_BITS.update | CRUD_BITS.delete;
    const syntheticOwnerAdmin = {
      id: 'owner',
      bucketId: effectiveBucket.id,
      userId: targetUser.id,
      bucketCrud: fullCrud,
      bucketMessagesCrud: fullCrud,
      bucketAdminsCrud: fullCrud,
      createdAt: effectiveBucket.createdAt,
    };
    res.status(200).json({ admin: bucketAdminToJson(syntheticOwnerAdmin, targetUser) });
    return;
  }
  const existing = await BucketAdminService.findByBucketAndUser(effectiveBucket.id, targetUser.id);
  if (existing === null) {
    res.status(404).json({ message: 'Bucket admin not found' });
    return;
  }
  res.status(200).json({ admin: bucketAdminToJson(existing, targetUser) });
}

export async function createBucketAdmin(req: Request, res: Response): Promise<void> {
  const ctx = await getBucketContext(req, res, {
    paramKey: 'bucketId',
    can: canManageBucketAdmins,
    requireRoot: true,
    requireRootMessage: ADMINS_ROOT_MESSAGE,
  });
  if (ctx === null) return;
  const { effectiveBucket } = ctx.resolved;
  const body = req.body as CreateBucketAdminBody;
  const targetUser = await resolveUser(body.userId);
  if (targetUser === null) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  const existing = await BucketAdminService.findByBucketAndUser(effectiveBucket.id, targetUser.id);
  if (existing !== null) {
    res.status(409).json({ message: 'User is already an admin for this bucket' });
    return;
  }
  const bucketAdminsCrud = (body.bucketAdminsCrud ?? ADMIN_CRUD_READ) | ADMIN_CRUD_READ;
  const { bucketCrud, bucketMessagesCrud } = normalizeBucketMessageCrud(
    body.bucketCrud ?? 0,
    body.bucketMessagesCrud ?? 0
  );
  const createdBucketAdmin = await BucketAdminService.create({
    bucketId: effectiveBucket.id,
    userId: targetUser.id,
    bucketCrud,
    bucketMessagesCrud,
    bucketAdminsCrud,
  });
  res.status(201).json({ admin: bucketAdminToJson(createdBucketAdmin, targetUser) });
}

export async function updateBucketAdmin(req: Request, res: Response): Promise<void> {
  const ctx = await getBucketContext(req, res, {
    paramKey: 'bucketId',
    can: canManageBucketAdmins,
    requireRoot: true,
    requireRootMessage: ADMINS_ROOT_MESSAGE,
  });
  if (ctx === null) return;
  const userIdParam = req.params.userId as string;
  const { effectiveBucket } = ctx.resolved;
  const targetUser = await resolveUser(userIdParam);
  if (targetUser === null) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  if (targetUser.id === effectiveBucket.ownerId) {
    res.status(403).json({ message: 'Bucket owner cannot be edited' });
    return;
  }
  const existing = await BucketAdminService.findByBucketAndUser(effectiveBucket.id, targetUser.id);
  if (existing === null) {
    res.status(404).json({ message: 'Bucket admin not found' });
    return;
  }
  const body = req.body as UpdateBucketAdminBody;
  const update: { bucketCrud?: number; bucketMessagesCrud?: number; bucketAdminsCrud?: number } =
    {};
  if (body.bucketCrud !== undefined || body.bucketMessagesCrud !== undefined) {
    const { bucketCrud, bucketMessagesCrud } = normalizeBucketMessageCrud(
      body.bucketCrud ?? existing.bucketCrud,
      body.bucketMessagesCrud ?? existing.bucketMessagesCrud
    );
    update.bucketCrud = bucketCrud;
    update.bucketMessagesCrud = bucketMessagesCrud;
  }
  if (body.bucketAdminsCrud !== undefined)
    update.bucketAdminsCrud = body.bucketAdminsCrud | ADMIN_CRUD_READ;
  if (Object.keys(update).length > 0) {
    await BucketAdminService.update(effectiveBucket.id, targetUser.id, update);
  }
  const updated = await BucketAdminService.findByBucketAndUser(effectiveBucket.id, targetUser.id);
  if (updated === null) {
    res.status(500).json({ message: 'Failed to load updated admin' });
    return;
  }
  res.status(200).json({ admin: bucketAdminToJson(updated, targetUser) });
}

export async function deleteBucketAdmin(req: Request, res: Response): Promise<void> {
  const ctx = await getBucketContext(req, res, {
    paramKey: 'bucketId',
    can: canManageBucketAdmins,
    requireRoot: true,
    requireRootMessage: ADMINS_ROOT_MESSAGE,
  });
  if (ctx === null) return;
  const userIdParam = req.params.userId as string;
  const { effectiveBucket } = ctx.resolved;
  const targetUser = await resolveUser(userIdParam);
  if (targetUser === null) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  const existing = await BucketAdminService.findByBucketAndUser(effectiveBucket.id, targetUser.id);
  if (existing === null) {
    res.status(404).json({ message: 'Bucket admin not found' });
    return;
  }
  if (targetUser.id === effectiveBucket.ownerId) {
    res.status(403).json({ message: 'Bucket owner cannot be removed' });
    return;
  }
  await BucketAdminService.remove(effectiveBucket.id, targetUser.id);
  res.status(204).send();
}
