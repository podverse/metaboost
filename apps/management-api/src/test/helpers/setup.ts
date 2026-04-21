import { managementDataSource } from '@metaboost/management-orm';
import {
  appDataSourceRead,
  appDataSourceReadWrite,
  DEFAULT_TERMS_LOCALIZED_CONTENT,
  DEFAULT_TERMS_TITLE,
  DEFAULT_TERMS_VERSION_KEY,
  TermsVersionService,
} from '@metaboost/orm';

import { createApp } from '../../app.js';
import { createSuperAdminForTest } from '../createSuperAdminForTest.js';

export type ManagementApiTestApp = ReturnType<typeof createApp>;

export async function initializeManagementApiTestDataSources(): Promise<void> {
  await appDataSourceRead.initialize();
  await appDataSourceReadWrite.initialize();
  await TermsVersionService.assertConfiguredForStartup(new Date(), {
    defaultVersionKey: DEFAULT_TERMS_VERSION_KEY,
    defaultTitle: DEFAULT_TERMS_TITLE,
    defaultLocalizedContent: DEFAULT_TERMS_LOCALIZED_CONTENT,
  });
  await managementDataSource.initialize();
}

export async function bootstrapManagementSuperAdmin(
  username: string,
  password: string
): Promise<void> {
  await createSuperAdminForTest(username, password);
}

export async function createManagementApiTestApp(): Promise<ManagementApiTestApp> {
  await initializeManagementApiTestDataSources();
  return createApp();
}

export async function createManagementApiTestAppWithSuperAdmin(
  username: string,
  password: string
): Promise<ManagementApiTestApp> {
  const app = await createManagementApiTestApp();
  await bootstrapManagementSuperAdmin(username, password);
  return app;
}

export async function destroyManagementApiTestDataSources(): Promise<void> {
  if (managementDataSource.isInitialized) {
    await managementDataSource.destroy();
  }
  if (appDataSourceReadWrite.isInitialized) {
    await appDataSourceReadWrite.destroy();
  }
  if (appDataSourceRead.isInitialized) {
    await appDataSourceRead.destroy();
  }
}
