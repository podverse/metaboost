import { appDataSourceRead, appDataSourceReadWrite } from '@metaboost/orm';

import { createApp } from '../../app.js';

export type ApiTestApp = ReturnType<typeof createApp>;

export async function initializeApiTestDataSources(): Promise<void> {
  await appDataSourceRead.initialize();
  await appDataSourceReadWrite.initialize();
}

export async function createApiTestApp(): Promise<ApiTestApp> {
  await initializeApiTestDataSources();
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
