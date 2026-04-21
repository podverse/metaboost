import {
  appDataSourceRead,
  appDataSourceReadWrite,
  DEFAULT_TERMS_LOCALIZED_CONTENT,
  DEFAULT_TERMS_TITLE,
  DEFAULT_TERMS_VERSION_KEY,
  TermsVersionService,
} from '@metaboost/orm';

import { createApp } from '../../app.js';

export type ApiTestApp = ReturnType<typeof createApp>;

export async function initializeApiTestDataSources(): Promise<void> {
  await appDataSourceRead.initialize();
  await appDataSourceReadWrite.initialize();
}

export async function createApiTestApp(): Promise<ApiTestApp> {
  await initializeApiTestDataSources();
  await TermsVersionService.assertConfiguredForStartup(new Date(), {
    defaultVersionKey: `${DEFAULT_TERMS_VERSION_KEY}-test`,
    defaultTitle: DEFAULT_TERMS_TITLE,
    defaultLocalizedContent: DEFAULT_TERMS_LOCALIZED_CONTENT,
  });
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
