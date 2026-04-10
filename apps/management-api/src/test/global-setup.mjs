/**
 * Vitest globalSetup: truncate management and main app tables so each test run starts clean.
 * Runs once before any test file; does not load setup.ts—defaults must match make test_db_init and setup.ts.
 * Requires both management and main test DBs to exist and be initialized.
 */
import pg from 'pg';

const mainEnv = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? '5532', 10),
  database: process.env.DB_APP_NAME ?? 'boilerplate_app_test',
  user: process.env.DB_APP_READ_WRITE_USER ?? 'boilerplate_app_read_write',
  password: process.env.DB_APP_READ_WRITE_PASSWORD ?? 'test',
};

const managementEnv = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? '5532', 10),
  database: process.env.DB_MANAGEMENT_NAME ?? 'boilerplate_management_test',
  user: process.env.DB_MANAGEMENT_READ_WRITE_USER ?? 'boilerplate_management_read_write',
  password: process.env.DB_MANAGEMENT_READ_WRITE_PASSWORD ?? 'test',
};

export default async function globalSetup() {
  const mainClient = new pg.Client(mainEnv);
  const managementClient = new pg.Client(managementEnv);
  try {
    await mainClient.connect();
    await mainClient.query('TRUNCATE "user" RESTART IDENTITY CASCADE;');
  } catch (err) {
    console.error('global-setup (main DB): failed to truncate:', err.message);
    throw err;
  } finally {
    await mainClient.end();
  }
  try {
    await managementClient.connect();
    await managementClient.query('TRUNCATE management_event;');
    await managementClient.query('TRUNCATE management_user CASCADE;');
  } catch (err) {
    console.error('global-setup (management DB): failed to truncate:', err.message);
    throw err;
  } finally {
    await managementClient.end();
  }
}
