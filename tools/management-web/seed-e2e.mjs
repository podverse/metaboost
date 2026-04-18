#!/usr/bin/env node
/**
 * Deterministic E2E seed for management-web: management DB (metaboost_management_test).
 * Inserts fixed super admin and optional admin. Run after make e2e_deps.
 * Uses test DB env defaults (DB_HOST/DB_PORT, DB_MANAGEMENT_*, or localhost / 5632 / metaboost_management_test).
 */
import bcrypt from 'bcrypt';
import pg from 'pg';

const DB_HOST = process.env.DB_HOST ?? 'localhost';
const DB_PORT = Number(process.env.DB_PORT ?? '5632', 10);
const managementDbName = process.env.DB_MANAGEMENT_NAME ?? 'metaboost_management_test';
const DB_USER =
  process.env.DB_MANAGEMENT_READ_WRITE_USER ??
  process.env.DB_APP_READ_WRITE_USER ??
  process.env.DB_READ_WRITE_USER ??
  'metaboost_management_read_write';
const DB_PASSWORD =
  process.env.DB_MANAGEMENT_READ_WRITE_PASSWORD ??
  process.env.DB_APP_READ_WRITE_PASSWORD ??
  process.env.DB_READ_WRITE_PASSWORD ??
  'test';

const E2E_SUPER_ADMIN_ID = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const E2E_SUPER_ADMIN_USERNAME = 'e2e-superadmin';
const E2E_LIMITED_ADMIN_ID = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
const E2E_LIMITED_ADMIN_USERNAME = 'e2e-limitedadmin';
const E2E_ADMIN_BUCKET_ADMINS_ID = 'cccccccc-cccc-4ccc-cccc-cccccccccccc';
const E2E_ADMIN_BUCKET_ADMINS_USERNAME = 'e2e-admin-bucket-admins';
const E2E_ADMIN_NO_BUCKET_ADMINS_ID = 'dddddddd-dddd-4ddd-dddd-dddddddddddd';
const E2E_ADMIN_NO_BUCKET_ADMINS_USERNAME = 'e2e-admin-no-bucket-admins';
const E2E_PASSWORD_PLAIN = 'Test!1Aa';
const E2E_DISPLAY_NAME = 'E2E Super Admin';
const E2E_LIMITED_DISPLAY_NAME = 'E2E Limited Admin';
const E2E_ADMIN_BUCKET_ADMINS_DISPLAY_NAME = 'E2E Admin Bucket Admins';
const E2E_ADMIN_NO_BUCKET_ADMINS_DISPLAY_NAME = 'E2E Admin No Bucket Admins';

async function main() {
  const passwordHash = await bcrypt.hash(E2E_PASSWORD_PLAIN, 10);
  const client = new pg.Client({
    host: DB_HOST,
    port: DB_PORT,
    database: managementDbName,
    user: DB_USER,
    password: DB_PASSWORD,
  });
  await client.connect();
  try {
    await client.query('TRUNCATE management_event;');
    await client.query('TRUNCATE management_user CASCADE;');
    await client.query(
      `INSERT INTO management_user (id, is_super_admin, created_at, created_by)
       VALUES ($1, true, NOW(), NULL)`,
      [E2E_SUPER_ADMIN_ID]
    );
    await client.query(
      `INSERT INTO management_user_credentials (management_user_id, username, password_hash)
       VALUES ($1, $2, $3)`,
      [E2E_SUPER_ADMIN_ID, E2E_SUPER_ADMIN_USERNAME, passwordHash]
    );
    await client.query(
      `INSERT INTO management_user_bio (management_user_id, display_name) VALUES ($1, $2)`,
      [E2E_SUPER_ADMIN_ID, E2E_DISPLAY_NAME]
    );
    await client.query(
      `INSERT INTO admin_permissions (admin_id, admins_crud, users_crud, buckets_crud, bucket_messages_crud, bucket_admins_crud, event_visibility)
       VALUES ($1, 15, 15, 15, 15, 15, 'all')`,
      [E2E_SUPER_ADMIN_ID]
    );

    await client.query(
      `INSERT INTO management_user (id, is_super_admin, created_at, created_by)
       VALUES ($1, false, NOW(), $2)`,
      [E2E_LIMITED_ADMIN_ID, E2E_SUPER_ADMIN_ID]
    );
    await client.query(
      `INSERT INTO management_user_credentials (management_user_id, username, password_hash)
       VALUES ($1, $2, $3)`,
      [E2E_LIMITED_ADMIN_ID, E2E_LIMITED_ADMIN_USERNAME, passwordHash]
    );
    await client.query(
      `INSERT INTO management_user_bio (management_user_id, display_name) VALUES ($1, $2)`,
      [E2E_LIMITED_ADMIN_ID, E2E_LIMITED_DISPLAY_NAME]
    );
    await client.query(
      `INSERT INTO admin_permissions (admin_id, admins_crud, users_crud, buckets_crud, bucket_messages_crud, bucket_admins_crud, event_visibility)
       VALUES ($1, 15, 15, 0, 0, 0, 'own')`,
      [E2E_LIMITED_ADMIN_ID]
    );

    await client.query(
      `INSERT INTO management_user (id, is_super_admin, created_at, created_by)
       VALUES ($1, false, NOW(), $2)`,
      [E2E_ADMIN_BUCKET_ADMINS_ID, E2E_SUPER_ADMIN_ID]
    );
    await client.query(
      `INSERT INTO management_user_credentials (management_user_id, username, password_hash)
       VALUES ($1, $2, $3)`,
      [E2E_ADMIN_BUCKET_ADMINS_ID, E2E_ADMIN_BUCKET_ADMINS_USERNAME, passwordHash]
    );
    await client.query(
      `INSERT INTO management_user_bio (management_user_id, display_name) VALUES ($1, $2)`,
      [E2E_ADMIN_BUCKET_ADMINS_ID, E2E_ADMIN_BUCKET_ADMINS_DISPLAY_NAME]
    );
    await client.query(
      `INSERT INTO admin_permissions (admin_id, admins_crud, users_crud, buckets_crud, bucket_messages_crud, bucket_admins_crud, event_visibility)
       VALUES ($1, 0, 0, 2, 0, 15, 'all_admins')`,
      [E2E_ADMIN_BUCKET_ADMINS_ID]
    );

    await client.query(
      `INSERT INTO management_user (id, is_super_admin, created_at, created_by)
       VALUES ($1, false, NOW(), $2)`,
      [E2E_ADMIN_NO_BUCKET_ADMINS_ID, E2E_SUPER_ADMIN_ID]
    );
    await client.query(
      `INSERT INTO management_user_credentials (management_user_id, username, password_hash)
       VALUES ($1, $2, $3)`,
      [E2E_ADMIN_NO_BUCKET_ADMINS_ID, E2E_ADMIN_NO_BUCKET_ADMINS_USERNAME, passwordHash]
    );
    await client.query(
      `INSERT INTO management_user_bio (management_user_id, display_name) VALUES ($1, $2)`,
      [E2E_ADMIN_NO_BUCKET_ADMINS_ID, E2E_ADMIN_NO_BUCKET_ADMINS_DISPLAY_NAME]
    );
    await client.query(
      `INSERT INTO admin_permissions (admin_id, admins_crud, users_crud, buckets_crud, bucket_messages_crud, bucket_admins_crud, event_visibility)
       VALUES ($1, 0, 0, 2, 0, 0, 'all_admins')`,
      [E2E_ADMIN_NO_BUCKET_ADMINS_ID]
    );

    console.log(
      'E2E management-web seed done: super-admin (e2e-superadmin), limited-admin (e2e-limitedadmin), admin-with-bucket-admins (e2e-admin-bucket-admins), admin-without-bucket-admins (e2e-admin-no-bucket-admins).'
    );
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('tools/management-web/seed-e2e.mjs:', err.message);
  process.exit(1);
});
