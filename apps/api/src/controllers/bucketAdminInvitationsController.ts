import type { CreateBucketAdminInvitationBody } from '../schemas/buckets.js';
import type { Request, Response } from 'express';

import { randomBytes } from 'crypto';

import {
  BUCKET_ADMIN_INVITATION_EXPIRY_DAYS,
  BUCKET_ADMIN_INVITATION_TOKEN_BYTES,
  CRUD_BITS,
} from '@boilerplate/helpers';
import { BucketAdminService, BucketAdminInvitationService } from '@boilerplate/orm';

import { normalizeBucketMessageCrud } from '../lib/bucket-admin-permissions.js';
import { getBucketContext } from '../lib/bucket-context.js';
import { canManageBucketAdmins } from '../lib/bucket-policy.js';

const ADMIN_CRUD_READ = CRUD_BITS.read;

const INVITATIONS_ROOT_MESSAGE = 'Admin invitations are managed on the root bucket only.';

function generateInvitationToken(): string {
  return randomBytes(BUCKET_ADMIN_INVITATION_TOKEN_BYTES).toString('base64url');
}

/** GET /admin-invitations/:token – public, returns invitation details for the invite page. */
export async function getInvitationByToken(req: Request, res: Response): Promise<void> {
  const token = req.params.token as string;
  const inv = await BucketAdminInvitationService.findByToken(token);
  if (inv === null) {
    res.status(404).json({ message: 'Invitation not found or invalid' });
    return;
  }
  if (inv.status !== 'pending') {
    res.status(410).json({
      message:
        inv.status === 'accepted' ? 'Invitation already accepted' : 'Invitation was declined',
      status: inv.status,
    });
    return;
  }
  const bucket = inv.bucket;
  res.status(200).json({
    invitation: {
      token: inv.token,
      bucketId: inv.bucketId,
      bucketShortId: bucket?.shortId ?? undefined,
      bucketName: bucket?.name ?? undefined,
      bucketCrud: inv.bucketCrud,
      bucketMessagesCrud: inv.bucketMessagesCrud,
      bucketAdminsCrud: inv.bucketAdminsCrud | ADMIN_CRUD_READ,
      status: inv.status,
    },
  });
}

/** POST /buckets/:bucketId/admin-invitations – create invitation (auth, can manage admins). */
export async function createBucketAdminInvitation(req: Request, res: Response): Promise<void> {
  const ctx = await getBucketContext(req, res, {
    paramKey: 'bucketId',
    can: canManageBucketAdmins,
    requireRoot: true,
    requireRootMessage: INVITATIONS_ROOT_MESSAGE,
  });
  if (ctx === null) return;
  const { effectiveBucket } = ctx.resolved;
  const body = req.body as CreateBucketAdminInvitationBody;
  const token = generateInvitationToken();
  const expiresAt = new Date(
    Date.now() + BUCKET_ADMIN_INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  );
  const bucketAdminsCrud = (body.bucketAdminsCrud ?? ADMIN_CRUD_READ) | ADMIN_CRUD_READ;
  const { bucketCrud, bucketMessagesCrud } = normalizeBucketMessageCrud(
    body.bucketCrud ?? 0,
    body.bucketMessagesCrud ?? 0
  );
  const inv = await BucketAdminInvitationService.create({
    bucketId: effectiveBucket.id,
    token,
    bucketCrud,
    bucketMessagesCrud,
    bucketAdminsCrud,
    expiresAt,
  });
  res.status(201).json({
    invitation: {
      id: inv.id,
      token: inv.token,
      bucketCrud: inv.bucketCrud,
      bucketMessagesCrud: inv.bucketMessagesCrud,
      bucketAdminsCrud: inv.bucketAdminsCrud,
      status: inv.status,
      expiresAt: inv.expiresAt.toISOString(),
    },
  });
}

function invitationToJson(inv: {
  id: string;
  token: string;
  bucketCrud: number;
  bucketMessagesCrud: number;
  bucketAdminsCrud: number;
  status: string;
  expiresAt: Date;
}) {
  return {
    id: inv.id,
    token: inv.token,
    bucketCrud: inv.bucketCrud,
    bucketMessagesCrud: inv.bucketMessagesCrud,
    bucketAdminsCrud: inv.bucketAdminsCrud,
    status: inv.status,
    expiresAt: inv.expiresAt.toISOString(),
  };
}

/** GET /buckets/:bucketId/admin-invitations – list pending invitations (auth, can manage admins). */
export async function listBucketAdminInvitations(req: Request, res: Response): Promise<void> {
  const ctx = await getBucketContext(req, res, {
    paramKey: 'bucketId',
    can: canManageBucketAdmins,
  });
  if (ctx === null) return;
  const { effectiveBucket } = ctx.resolved;
  const list = await BucketAdminInvitationService.findByBucketIdPending(effectiveBucket.id);
  res.status(200).json({
    invitations: list.map((inv) => invitationToJson(inv)),
  });
}

/** DELETE /buckets/:bucketId/admin-invitations/:invitationId – delete a pending invitation. */
export async function deleteBucketAdminInvitation(req: Request, res: Response): Promise<void> {
  const ctx = await getBucketContext(req, res, {
    paramKey: 'bucketId',
    can: canManageBucketAdmins,
    requireRoot: true,
    requireRootMessage: INVITATIONS_ROOT_MESSAGE,
  });
  if (ctx === null) return;
  const invitationId = req.params.invitationId as string;
  const { effectiveBucket } = ctx.resolved;
  const list = await BucketAdminInvitationService.findByBucketIdPending(effectiveBucket.id);
  const inv = list.find((i) => i.id === invitationId);
  if (inv === undefined) {
    res.status(404).json({ message: 'Invitation not found or not pending' });
    return;
  }
  await BucketAdminInvitationService.remove(invitationId);
  res.status(204).send();
}

/** POST /admin-invitations/:token/accept – accept invitation (auth), creates bucket_admin. */
export async function acceptInvitation(req: Request, res: Response): Promise<void> {
  const user = req.user;
  if (user === undefined) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  const token = req.params.token as string;
  const inv = await BucketAdminInvitationService.findByToken(token);
  if (inv === null) {
    res.status(404).json({ message: 'Invitation not found or invalid' });
    return;
  }
  if (inv.status !== 'pending') {
    res.status(410).json({
      message:
        inv.status === 'accepted' ? 'Invitation already accepted' : 'Invitation was declined',
      status: inv.status,
    });
    return;
  }
  const bucket = inv.bucket;
  if (bucket !== undefined && bucket !== null && bucket.ownerId === user.id) {
    await BucketAdminInvitationService.updateStatus(inv.id, 'accepted');
    res.status(200).json({
      message: 'You are the owner of this bucket',
      alreadyOwner: true,
      bucketShortId: bucket.shortId,
    });
    return;
  }
  const existing = await BucketAdminService.findByBucketAndUser(inv.bucketId, user.id);
  if (existing !== null) {
    await BucketAdminInvitationService.updateStatus(inv.id, 'accepted');
    const bucketForRedirect = inv.bucket;
    res.status(200).json({
      message: 'You are already an admin for this bucket',
      alreadyAdmin: true,
      bucketShortId:
        bucketForRedirect !== undefined && bucketForRedirect !== null
          ? bucketForRedirect.shortId
          : undefined,
    });
    return;
  }
  const bucketAdminsCrud = inv.bucketAdminsCrud | ADMIN_CRUD_READ;
  await BucketAdminService.create({
    bucketId: inv.bucketId,
    userId: user.id,
    bucketCrud: inv.bucketCrud,
    bucketMessagesCrud: inv.bucketMessagesCrud,
    bucketAdminsCrud,
  });
  await BucketAdminInvitationService.updateStatus(inv.id, 'accepted');
  res.status(200).json({ message: 'You have been added as an admin', accepted: true });
}

/** POST /admin-invitations/:token/reject – reject invitation (auth). */
export async function rejectInvitation(req: Request, res: Response): Promise<void> {
  const user = req.user;
  if (user === undefined) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  const token = req.params.token as string;
  const inv = await BucketAdminInvitationService.findByToken(token);
  if (inv === null) {
    res.status(404).json({ message: 'Invitation not found or invalid' });
    return;
  }
  if (inv.status !== 'pending') {
    res.status(410).json({
      message: 'Invitation is no longer pending',
      status: inv.status,
    });
    return;
  }
  await BucketAdminInvitationService.updateStatus(inv.id, 'rejected');
  res.status(200).json({ message: 'Invitation declined', rejected: true });
}
