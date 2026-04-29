import type { UpdateBucketAdminBody } from '../schemas/buckets.js';
import type { UserWithRelations } from '@metaboost/orm';
import type { Request, Response } from 'express';

import { CRUD_BITS } from '@metaboost/helpers';
import { BucketAdminService, UserService } from '@metaboost/orm';

import { normalizeBucketMessageCrud } from '../lib/bucket-admin-permissions.js';
import { getBucketResolved } from '../lib/bucket-context.js';

const ADMIN_CRUD_READ = CRUD_BITS.read;

/** Serialize main-app user for bucket admin responses (id, idText, email, displayName). */
function mainAppUserToJson(user: UserWithRelations): {
  id: string;
  idText: string;
  email: string | null;
  username: string | null;
  displayName: string | null;
} {
  return {
    id: user.id,
    idText: user.idText,
    email: user.credentials.email ?? null,
    username: user.credentials.username ?? null,
    displayName: user.bio?.displayName ?? null,
  };
}

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
    createdAt: bucketAdmin.createdAt.toISOString(),
    user: user !== null ? mainAppUserToJson(user) : null,
  };
}

export async function listBucketAdmins(req: Request, res: Response): Promise<void> {
  const resolved = await getBucketResolved(req, res);
  if (resolved === null) return;
  const { effectiveBucket } = resolved;
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

export async function getBucketAdmin(req: Request, res: Response): Promise<void> {
  const userIdParam = req.params.userId as string;
  const resolved = await getBucketResolved(req, res);
  if (resolved === null) return;
  const { effectiveBucket } = resolved;
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
  res.status(200).json({ admin: bucketAdminToJson(existing, targetUser) });
}

export async function updateBucketAdmin(req: Request, res: Response): Promise<void> {
  const userIdParam = req.params.userId as string;
  const resolved = await getBucketResolved(req, res, {
    requireRoot: true,
    requireRootMessage: 'Admins are managed on the root bucket only.',
  });
  if (resolved === null) return;
  const { effectiveBucket } = resolved;
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
    res.status(403).json({ message: 'Bucket owner cannot be edited' });
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
  const userIdParam = req.params.userId as string;
  const resolved = await getBucketResolved(req, res, {
    requireRoot: true,
    requireRootMessage: 'Admins are managed on the root bucket only.',
  });
  if (resolved === null) return;
  const { effectiveBucket } = resolved;
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
