import { managementDataSource } from '@metaboost/management-orm';

function isLikelyTestDatabase(databaseName: string): boolean {
  return /(^test_|_test$|_test_|test$|^test$)/i.test(databaseName);
}

export async function initializeManagementDataSource(allowTestDb: boolean): Promise<void> {
  const databaseName = process.env.DB_MANAGEMENT_NAME;
  if (databaseName === undefined || databaseName === '') {
    throw new Error('DB_MANAGEMENT_NAME is required to seed management database.');
  }
  if (!allowTestDb && isLikelyTestDatabase(databaseName)) {
    throw new Error(
      `Refusing to seed likely test DB "${databaseName}" without --allowTestDb. This guard prevents accidental test data pollution.`
    );
  }
  if (!managementDataSource.isInitialized) {
    await managementDataSource.initialize();
  }
}

export async function cleanupManagementDataSource(): Promise<void> {
  if (managementDataSource.isInitialized) {
    await managementDataSource.destroy();
  }
}

export async function truncateManagementData(): Promise<void> {
  await managementDataSource.query(`
    TRUNCATE TABLE
      management_refresh_token,
      management_event,
      admin_permissions,
      management_user_bio,
      management_user_credentials,
      management_user,
      management_admin_role
    RESTART IDENTITY CASCADE
  `);
}
