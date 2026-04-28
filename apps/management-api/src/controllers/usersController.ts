import type { CreateUserBody, UpdateUserBody, ChangeUserPasswordBody } from '../schemas/users.js';
import type { SqlSortDirection } from '@metaboost/helpers';
import type { UserWithRelations } from '@metaboost/orm';
import type { Request, Response } from 'express';

import crypto from 'crypto';

import { flagsToBitmask, parseSortOrderQueryParam, validatePassword } from '@metaboost/helpers';
import { getPasswordValidationMessages, resolveLocale } from '@metaboost/helpers-i18n';
import { EVENT_ACTIONS, EVENT_TARGET_TYPES } from '@metaboost/management-orm';
import {
  BucketAdminService,
  UserService,
  VerificationTokenService,
  appDataSourceRead,
  appDataSourceReadWrite,
  User,
  UserBio,
} from '@metaboost/orm';

import { config } from '../config/index.js';
import { hashPassword } from '../lib/auth/hash.js';
import { recordEvent } from '../lib/recordEvent.js';
import { generateToken, getSetPasswordExpiry, hashToken } from '../lib/set-password-token.js';

/**
 * Single place to serialize a main-app user for responses. Returns only safe, non-sensitive fields.
 * Never include passwordHash or pass user.credentials to res.json(). Use this for all user responses.
 */
function userToJson(user: UserWithRelations): {
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

const USER_SEARCH_COLUMN_IDS = ['email', 'displayName'] as const;

const USER_SORT_FIELDS = ['email', 'displayName', 'createdAt'] as const;

export async function listUsers(req: Request, res: Response): Promise<void> {
  const searchRaw =
    typeof req.query.search === 'string' && req.query.search.trim() !== ''
      ? req.query.search.trim()
      : undefined;
  const filterColumnsRaw =
    typeof req.query.filterColumns === 'string' && req.query.filterColumns.trim() !== ''
      ? req.query.filterColumns.trim()
      : undefined;
  const searchColumns =
    filterColumnsRaw !== undefined
      ? filterColumnsRaw
          .split(',')
          .map((s) => s.trim())
          .filter((id): id is (typeof USER_SEARCH_COLUMN_IDS)[number] =>
            USER_SEARCH_COLUMN_IDS.includes(id as (typeof USER_SEARCH_COLUMN_IDS)[number])
          )
      : [...USER_SEARCH_COLUMN_IDS];
  const searchInEmail = searchColumns.length === 0 || searchColumns.includes('email');
  const searchInDisplayName = searchColumns.length === 0 || searchColumns.includes('displayName');

  const sortByRaw = typeof req.query.sortBy === 'string' ? req.query.sortBy.trim() : undefined;
  const sortBy =
    sortByRaw !== undefined && (USER_SORT_FIELDS as readonly string[]).includes(sortByRaw)
      ? sortByRaw
      : 'email';
  const sortOrderParam = parseSortOrderQueryParam(req.query.sortOrder);
  const sortOrder: SqlSortDirection =
    sortOrderParam === 'asc'
      ? 'ASC'
      : sortOrderParam === 'desc'
        ? 'DESC'
        : sortBy === 'createdAt'
          ? 'DESC'
          : 'ASC';

  const repo = appDataSourceRead.getRepository(User);
  const qb = repo
    .createQueryBuilder('user')
    .leftJoinAndSelect('user.credentials', 'credentials')
    .leftJoinAndSelect('user.bio', 'bio');

  if (sortBy === 'email') {
    qb.orderBy('credentials.email', sortOrder);
  } else if (sortBy === 'displayName') {
    qb.orderBy('bio.displayName', sortOrder);
  } else {
    qb.orderBy('user.createdAt', sortOrder);
  }

  if (searchRaw !== undefined) {
    const escaped = searchRaw.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
    const conditions: string[] = [];
    if (searchInEmail) {
      conditions.push("LOWER(credentials.email) LIKE LOWER(:search) ESCAPE '\\'");
    }
    if (searchInDisplayName) {
      conditions.push("LOWER(bio.display_name) LIKE LOWER(:search) ESCAPE '\\'");
    }
    if (conditions.length > 0) {
      qb.andWhere(`(${conditions.join(' OR ')})`, { search: `%${escaped}%` });
    }
  }
  const users = await qb.getMany();
  res.status(200).json({
    users: (users as UserWithRelations[]).map((u) => userToJson(u)),
  });
}

export async function getUser(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const user = await UserService.findById(id);
  if (user === null) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  res.status(200).json({ user: userToJson(user) });
}

export async function createUser(req: Request, res: Response): Promise<void> {
  const actor = req.managementUser;
  if (actor === undefined) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  const body = req.body as CreateUserBody;

  const email =
    body.email !== undefined && body.email !== null && body.email.trim() !== ''
      ? body.email.trim()
      : null;
  const username =
    body.username !== undefined && body.username !== null && body.username.trim() !== ''
      ? body.username.trim()
      : null;
  if (email === null && username === null) {
    res.status(400).json({ message: 'At least one of email or username required' });
    return;
  }

  if (email !== null) {
    const existing = await UserService.findByEmail(email);
    if (existing !== null) {
      res.status(409).json({ message: 'Email already in use' });
      return;
    }
  }
  if (username !== null) {
    const existing = await UserService.findByUsername(username);
    if (existing !== null) {
      res.status(409).json({ message: 'Username already in use' });
      return;
    }
  }

  const passwordValue =
    body.password !== undefined && body.password !== null && body.password.trim() !== ''
      ? body.password.trim()
      : null;
  const canIssueInviteLink = config.accountSignupModeCapabilities.canIssueAdminInviteLink;
  let hashed: string;
  let useSetPasswordLink = false;

  if (passwordValue !== null) {
    const locale = resolveLocale(req.get('Accept-Language'));
    const passwordCheck = validatePassword(passwordValue, getPasswordValidationMessages(locale));
    if (!passwordCheck.valid) {
      res.status(400).json({ message: passwordCheck.message });
      return;
    }
    hashed = await hashPassword(passwordValue);
  } else {
    if (!canIssueInviteLink) {
      res.status(400).json({ message: 'Password is required when invitation links are disabled' });
      return;
    }
    const placeholderPassword = crypto.randomBytes(32).toString('hex');
    hashed = await hashPassword(placeholderPassword);
    useSetPasswordLink = true;
  }

  const user = await UserService.create({
    email: email ?? undefined,
    username: username ?? undefined,
    password: hashed,
    displayName: body.displayName ?? null,
  });

  let setPasswordLink: string | undefined;
  if (useSetPasswordLink) {
    const rawToken = generateToken();
    const tokenHash = hashToken(rawToken);
    await VerificationTokenService.createToken(
      user.id,
      'set_password',
      tokenHash,
      getSetPasswordExpiry(config.userInvitationTtlHours),
      null
    );
    const baseUrl = config.webAppUrl?.replace(/\/$/, '') ?? '';
    const setPasswordPath = `/auth/set-password?token=${rawToken}`;
    setPasswordLink = baseUrl !== '' ? `${baseUrl}${setPasswordPath}` : setPasswordPath;
  } else if (email !== null) {
    await UserService.setEmailVerifiedAt(user.id);
  }

  const fullCrud = flagsToBitmask({
    create: true,
    read: true,
    update: true,
    delete: true,
  });
  const bucketCrud = fullCrud;
  const bucketMessagesCrud = fullCrud;
  const bucketAdminsCrud = fullCrud;
  const bucketIds = body.initialBucketAdminIds ?? [];
  for (const bucketId of bucketIds) {
    await BucketAdminService.create({
      bucketId,
      userId: user.id,
      bucketCrud,
      bucketMessagesCrud,
      bucketAdminsCrud,
    });
  }

  await recordEvent({
    actor,
    action: EVENT_ACTIONS.user.created,
    targetType: EVENT_TARGET_TYPES.user,
    targetId: user.id,
    details: [email, username].filter(Boolean).join(', ') || 'user',
  });

  if (setPasswordLink !== undefined) {
    res.status(201).json({ user: userToJson(user), setPasswordLink });
  } else {
    res.status(201).json({ user: userToJson(user) });
  }
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  const actor = req.managementUser;
  if (actor === undefined) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  const id = req.params.id as string;
  const user = await UserService.findById(id);
  if (user === null) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  const body = req.body as UpdateUserBody;
  if (body.email !== undefined) {
    await UserService.updateEmail(id, body.email);
  }
  if (body.displayName !== undefined) {
    const bioRepo = appDataSourceReadWrite.getRepository(UserBio);
    await bioRepo.update({ userId: id }, { displayName: body.displayName });
  }
  await recordEvent({
    actor,
    action: EVENT_ACTIONS.user.updated,
    targetType: EVENT_TARGET_TYPES.user,
    targetId: id,
  });
  const updated = await UserService.findById(id);
  res.status(200).json({ user: updated !== null ? userToJson(updated) : userToJson(user) });
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  const actor = req.managementUser;
  if (actor === undefined) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  const id = req.params.id as string;
  const user = await UserService.findById(id);
  if (user === null) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  const userRepo = appDataSourceReadWrite.getRepository(User);
  await userRepo.delete(id);
  await recordEvent({
    actor,
    action: EVENT_ACTIONS.user.deleted,
    targetType: EVENT_TARGET_TYPES.user,
    targetId: id,
    details: user.credentials.email,
  });
  res.status(204).send();
}

export async function changeUserPassword(req: Request, res: Response): Promise<void> {
  const actor = req.managementUser;
  if (actor === undefined) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  if (!actor.isSuperAdmin) {
    const perm = actor.permissions;
    if (perm === undefined || perm === null || (perm.usersCrud & 4) === 0) {
      res.status(403).json({ message: 'Insufficient permissions to change user password' });
      return;
    }
  }
  const id = req.params.id as string;
  const user = await UserService.findById(id);
  if (user === null) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  const { newPassword } = req.body as ChangeUserPasswordBody;
  const locale = resolveLocale(req.get('Accept-Language'));
  const passwordCheck = validatePassword(newPassword, getPasswordValidationMessages(locale));
  if (!passwordCheck.valid) {
    res.status(400).json({ message: passwordCheck.message });
    return;
  }
  const hashed = await hashPassword(newPassword);
  await UserService.updatePassword(id, hashed);
  await recordEvent({
    actor,
    action: EVENT_ACTIONS.user.passwordChanged,
    targetType: EVENT_TARGET_TYPES.user,
    targetId: id,
  });
  res.status(204).send();
}
