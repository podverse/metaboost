import { appDataSource } from '@metaboost/orm';

function isLikelyTestDatabase(databaseName: string): boolean {
  return /(^test_|_test$|_test_|test$|^test$)/i.test(databaseName);
}

export async function initializeMainDataSource(allowTestDb: boolean): Promise<void> {
  const databaseName = process.env.DB_APP_NAME;
  if (databaseName === undefined || databaseName === '') {
    throw new Error('DB_APP_NAME is required to seed main database.');
  }
  if (!allowTestDb && isLikelyTestDatabase(databaseName)) {
    throw new Error(
      `Refusing to seed likely test DB "${databaseName}" without --allowTestDb. This guard prevents accidental test data pollution.`
    );
  }
  if (!appDataSource.isInitialized) {
    await appDataSource.initialize();
  }
}

export async function cleanupMainDataSource(): Promise<void> {
  if (appDataSource.isInitialized) {
    await appDataSource.destroy();
  }
}

export async function truncateMainData(): Promise<void> {
  await appDataSource.query(`
    TRUNCATE TABLE
      bucket_message_recipient_outcome,
      bucket_message_payment_verification,
      bucket_message_app_meta,
      bucket_message_value,
      bucket_message,
      bucket_admin_invitation,
      bucket_role,
      bucket_admin,
      bucket_rss_item_info,
      bucket_rss_channel_info,
      bucket_settings,
      bucket,
      verification_token,
      refresh_token,
      user_bio,
      user_credentials,
      "user"
    RESTART IDENTITY CASCADE
  `);
}
