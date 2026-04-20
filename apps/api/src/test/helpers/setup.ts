import { appDataSourceRead, appDataSourceReadWrite, TermsVersion } from '@metaboost/orm';

import { createApp } from '../../app.js';

export type ApiTestApp = ReturnType<typeof createApp>;

export async function initializeApiTestDataSources(): Promise<void> {
  await appDataSourceRead.initialize();
  await appDataSourceReadWrite.initialize();
}

export async function createApiTestApp(): Promise<ApiTestApp> {
  await initializeApiTestDataSources();
  const termsVersionRepo = appDataSourceReadWrite.getRepository(TermsVersion);
  const existingActive = await termsVersionRepo.findOne({ where: { status: 'active' } });
  if (existingActive === null) {
    const effectiveAtRaw = process.env.API_LATEST_TERMS_EFFECTIVE_AT ?? '2026-01-01T00:00:00.000Z';
    const effectiveAt = new Date(effectiveAtRaw);
    await termsVersionRepo.save(
      termsVersionRepo.create({
        versionKey: `test-${effectiveAt.toISOString()}`,
        title: 'Test Terms',
        contentHash: 'test-terms-hash',
        announcementStartsAt: null,
        effectiveAt,
        enforcementStartsAt: effectiveAt,
        status: 'active',
      })
    );
  }
  return createApp();
}

export async function destroyApiTestDataSources(): Promise<void> {
  if (appDataSourceReadWrite.isInitialized) {
    await appDataSourceReadWrite.destroy();
  }
  if (appDataSourceRead.isInitialized) {
    await appDataSourceRead.destroy();
  }
}
