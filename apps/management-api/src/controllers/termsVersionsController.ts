import type { CreateTermsVersionBody, UpdateTermsVersionBody } from '../schemas/termsVersions.js';
import type { TermsVersion as TermsVersionEntity } from '@metaboost/orm';
import type { Request, Response } from 'express';

import {
  appDataSourceRead,
  appDataSourceReadWrite,
  computeTermsContentHash,
  TermsVersion,
  TermsVersionContent,
} from '@metaboost/orm';

const DUPLICATE_UPCOMING_TERMS_MESSAGE = 'Only one upcoming terms version is allowed.';

/** PostgreSQL / TypeORM: detect unique violation on the partial index for a single "upcoming" row. */
function isDuplicateUpcomingIndexViolation(err: unknown): boolean {
  const tryLayer = (layer: unknown): boolean => {
    if (layer === null || typeof layer !== 'object') {
      return false;
    }
    const o = layer as { code?: string; constraint?: string; detail?: string; message?: string };
    if (o.code === '23505' && o.constraint === 'idx_terms_version_single_upcoming') {
      return true;
    }
    if (o.code === '23505' && o.detail !== undefined) {
      const d = o.detail;
      if (d.includes('(upcoming)')) {
        return true;
      }
    }
    if (o.code === '23505' && o.message !== undefined) {
      const m = o.message;
      if (m.includes('idx_terms_version_single_upcoming')) {
        return true;
      }
    }
    return false;
  };
  if (tryLayer(err)) {
    return true;
  }
  if (err !== null && typeof err === 'object' && 'driverError' in err) {
    return tryLayer((err as { driverError: unknown }).driverError);
  }
  if (err !== null && typeof err === 'object' && 'original' in err) {
    return tryLayer((err as { original: unknown }).original);
  }
  return false;
}

function toTermsVersionJson(version: TermsVersionEntity) {
  return {
    id: version.id,
    versionKey: version.versionKey,
    title: version.title,
    contentHash: version.contentHash,
    contentTextEnUs: version.content.contentTextEnUs,
    contentTextEs: version.content.contentTextEs,
    announcementStartsAt: version.announcementStartsAt?.toISOString() ?? null,
    enforcementStartsAt: version.enforcementStartsAt.toISOString(),
    status: version.status,
    createdAt: version.createdAt.toISOString(),
    updatedAt: version.updatedAt.toISOString(),
  };
}

function isAnnouncementBeforeEnforcement(
  announcementStartsAt: Date | null,
  enforcementStartsAt: Date
): boolean {
  return (
    announcementStartsAt === null || announcementStartsAt.getTime() <= enforcementStartsAt.getTime()
  );
}

async function ensureNoOtherUpcoming(excludeId?: string): Promise<void> {
  // Use read-write: must see the same committed state as the insert; read replica could lag
  // behind appDataSourceReadWrite and miss a just-created "upcoming" row.
  const repo = appDataSourceReadWrite.getRepository(TermsVersion);
  const existing = await repo.findOne({ where: { status: 'upcoming' } });
  if (existing !== null && existing.id !== excludeId) {
    throw new Error(DUPLICATE_UPCOMING_TERMS_MESSAGE);
  }
}

export async function listTermsVersions(_req: Request, res: Response): Promise<void> {
  const repo = appDataSourceRead.getRepository(TermsVersion);
  const termsVersions = await repo.find({
    order: { enforcementStartsAt: 'DESC', createdAt: 'DESC' },
    relations: { content: true },
  });
  res.status(200).json({ termsVersions: termsVersions.map(toTermsVersionJson) });
}

export async function getTermsVersion(req: Request, res: Response): Promise<void> {
  const id = req.params.id;
  if (typeof id !== 'string' || id.trim() === '') {
    res.status(400).json({ message: 'Invalid id' });
    return;
  }
  const repo = appDataSourceRead.getRepository(TermsVersion);
  const termsVersion = await repo.findOne({
    where: { id: id.trim() },
    relations: { content: true },
  });
  if (termsVersion === null) {
    res.status(404).json({ message: 'Terms version not found' });
    return;
  }
  res.status(200).json({ termsVersion: toTermsVersionJson(termsVersion) });
}

export async function createTermsVersion(req: Request, res: Response): Promise<void> {
  const body = req.body as CreateTermsVersionBody;
  const announcementStartsAt =
    body.announcementStartsAt === undefined || body.announcementStartsAt === null
      ? null
      : new Date(body.announcementStartsAt);
  const enforcementStartsAt = new Date(body.enforcementStartsAt);
  if (
    Number.isNaN(enforcementStartsAt.getTime()) ||
    (announcementStartsAt !== null && Number.isNaN(announcementStartsAt.getTime()))
  ) {
    res.status(400).json({ message: 'Invalid terms version date values' });
    return;
  }

  if (!isAnnouncementBeforeEnforcement(announcementStartsAt, enforcementStartsAt)) {
    res.status(400).json({
      message: 'announcementStartsAt must be null or on or before enforcementStartsAt',
    });
    return;
  }

  if (body.status === 'upcoming') {
    try {
      await ensureNoOtherUpcoming();
    } catch (err) {
      res.status(409).json({ message: err instanceof Error ? err.message : 'Conflict' });
      return;
    }
  }

  const repo = appDataSourceReadWrite.getRepository(TermsVersion);
  const contentRepo = appDataSourceReadWrite.getRepository(TermsVersionContent);
  const contentTextEnUs = body.contentTextEnUs;
  const contentTextEs = body.contentTextEs;
  const contentHash = computeTermsContentHash(contentTextEnUs, contentTextEs);
  try {
    const createdVersion = await repo.save(
      repo.create({
        versionKey: body.versionKey.trim(),
        title: body.title.trim(),
        contentHash,
        announcementStartsAt,
        enforcementStartsAt,
        status: body.status,
      })
    );
    await contentRepo.save(
      contentRepo.create({
        termsVersionId: createdVersion.id,
        contentTextEnUs,
        contentTextEs,
      })
    );
    const created = await repo.findOne({
      where: { id: createdVersion.id },
      relations: { content: true },
    });
    if (created === null) {
      res.status(404).json({ message: 'Terms version not found after create.' });
      return;
    }
    res.status(201).json({ termsVersion: toTermsVersionJson(created) });
  } catch (err) {
    if (isDuplicateUpcomingIndexViolation(err)) {
      res.status(409).json({ message: DUPLICATE_UPCOMING_TERMS_MESSAGE });
      return;
    }
    res.status(409).json({ message: 'Failed to create terms version (conflict).' });
  }
}

export async function updateTermsVersion(req: Request, res: Response): Promise<void> {
  const id = req.params.id;
  if (typeof id !== 'string' || id.trim() === '') {
    res.status(400).json({ message: 'Invalid id' });
    return;
  }
  const repo = appDataSourceReadWrite.getRepository(TermsVersion);
  const contentRepo = appDataSourceReadWrite.getRepository(TermsVersionContent);
  const existing = await repo.findOne({ where: { id: id.trim() }, relations: { content: true } });
  if (existing === null) {
    res.status(404).json({ message: 'Terms version not found' });
    return;
  }
  if (existing.status === 'current' || existing.status === 'deprecated') {
    res.status(400).json({ message: 'Only draft or upcoming terms versions can be updated.' });
    return;
  }

  const body = req.body as UpdateTermsVersionBody;
  if (body.status === 'upcoming' || (body.status === undefined && existing.status === 'upcoming')) {
    try {
      await ensureNoOtherUpcoming(existing.id);
    } catch (err) {
      res.status(409).json({ message: err instanceof Error ? err.message : 'Conflict' });
      return;
    }
  }

  if (body.title !== undefined) existing.title = body.title.trim();
  if (body.contentTextEnUs !== undefined) existing.content.contentTextEnUs = body.contentTextEnUs;
  if (body.contentTextEs !== undefined) existing.content.contentTextEs = body.contentTextEs;
  if (body.contentTextEnUs !== undefined || body.contentTextEs !== undefined) {
    existing.contentHash = computeTermsContentHash(
      existing.content.contentTextEnUs,
      existing.content.contentTextEs
    );
  }
  if (body.announcementStartsAt !== undefined) {
    existing.announcementStartsAt =
      body.announcementStartsAt === null ? null : new Date(body.announcementStartsAt);
  }
  if (body.enforcementStartsAt !== undefined) {
    existing.enforcementStartsAt = new Date(body.enforcementStartsAt);
  }
  if (body.status !== undefined) existing.status = body.status;

  if (
    Number.isNaN(existing.enforcementStartsAt.getTime()) ||
    (existing.announcementStartsAt !== null &&
      Number.isNaN(existing.announcementStartsAt.getTime()))
  ) {
    res.status(400).json({ message: 'Invalid terms version date values' });
    return;
  }

  if (
    !isAnnouncementBeforeEnforcement(existing.announcementStartsAt, existing.enforcementStartsAt)
  ) {
    res.status(400).json({
      message: 'announcementStartsAt must be null or on or before enforcementStartsAt',
    });
    return;
  }

  try {
    const updated = await repo.save(existing);
    await contentRepo.save(existing.content);
    res.status(200).json({ termsVersion: toTermsVersionJson(updated) });
  } catch (err) {
    if (isDuplicateUpcomingIndexViolation(err)) {
      res.status(409).json({ message: DUPLICATE_UPCOMING_TERMS_MESSAGE });
      return;
    }
    res.status(409).json({ message: 'Failed to update terms version (conflict).' });
  }
}

export async function promoteTermsVersionToCurrent(req: Request, res: Response): Promise<void> {
  const id = req.params.id;
  if (typeof id !== 'string' || id.trim() === '') {
    res.status(400).json({ message: 'Invalid id' });
    return;
  }

  const readRepo = appDataSourceRead.getRepository(TermsVersion);
  const target = await readRepo.findOne({ where: { id: id.trim() }, relations: { content: true } });
  if (target === null) {
    res.status(404).json({ message: 'Terms version not found' });
    return;
  }
  if (target.status !== 'upcoming') {
    res.status(400).json({ message: 'Only an upcoming terms version can be promoted.' });
    return;
  }

  const queryRunner = appDataSourceReadWrite.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  try {
    await queryRunner.manager
      .createQueryBuilder()
      .update(TermsVersion)
      .set({ status: 'deprecated' })
      .where('status = :status', { status: 'current' })
      .execute();

    await queryRunner.manager
      .createQueryBuilder()
      .update(TermsVersion)
      .set({ status: 'current' })
      .where('id = :id', { id: target.id })
      .execute();

    await queryRunner.commitTransaction();
  } catch {
    await queryRunner.rollbackTransaction();
    res.status(409).json({ message: 'Failed to promote terms version.' });
    await queryRunner.release();
    return;
  }
  await queryRunner.release();

  const updated = await readRepo.findOne({
    where: { id: target.id },
    relations: { content: true },
  });
  if (updated === null) {
    res.status(404).json({ message: 'Terms version not found after promote.' });
    return;
  }
  res.status(200).json({ termsVersion: toTermsVersionJson(updated) });
}
