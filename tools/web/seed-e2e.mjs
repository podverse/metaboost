#!/usr/bin/env node
/**
 * Deterministic E2E seed for web app: main DB (metaboost_app_test).
 * Inserts fixed user, credentials, bio, buckets, and deterministic auth-flow tokens for E2E.
 * Run after make e2e_deps.
 * Uses test DB env defaults (DB_HOST, DB_PORT 5632, DB_APP_NAME metaboost_app_test, metaboost_app_read_write/test).
 */
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import pg from 'pg';

const DB_HOST = process.env.DB_HOST ?? 'localhost';
const DB_PORT = Number(process.env.DB_PORT ?? '5632', 10);
const dbAppName = process.env.DB_APP_NAME ?? process.env.DB_NAME ?? 'metaboost_app_test';
const DB_USER =
  process.env.DB_APP_READ_WRITE_USER ??
  process.env.DB_READ_WRITE_USER ??
  'metaboost_app_read_write';
const DB_PASSWORD =
  process.env.DB_APP_READ_WRITE_PASSWORD ?? process.env.DB_READ_WRITE_PASSWORD ?? 'test';

const E2E_USER_ID = '11111111-1111-4111-a111-111111111111';
const E2E_BUCKET1_ID = '22222222-2222-4222-a222-222222222222';
const E2E_BUCKET2_ID = '33333333-3333-4333-a333-333333333333';
const E2E_USER2_ID = '44444444-4444-4444-a444-444444444444';
const E2E_USER3_ID = '55555555-5555-4555-a555-555555555555';
const E2E_USER4_ID = '66666666-6666-4666-a666-666666666666';
const E2E_USER5_ID = '77777777-7777-4777-a777-777777777777';
const E2E_USER_SHORT_ID = 'e2eusr000001';
const E2E_USER2_SHORT_ID = 'e2eusr000002';
const E2E_USER3_SHORT_ID = 'e2eusr000003';
const E2E_USER4_SHORT_ID = 'e2eusr000004';
const E2E_USER5_SHORT_ID = 'e2eusr000005';
const E2E_BUCKET1_SHORT_ID = 'e2ebkt000001';
const E2E_BUCKET2_SHORT_ID = 'e2ebkt000002';
const E2E_EMAIL = 'e2e-bucket-owner@example.com';
const E2E_EMAIL2 = 'e2e-bucket-admin@example.com';
const E2E_EMAIL3 = 'e2e-admin-without-permission@example.com';
const E2E_EMAIL4 = 'e2e-non-admin@example.com';
const E2E_EMAIL5 = 'e2e-invite@example.com';
const E2E_PASSWORD_PLAIN = 'Test!1Aa';
/** Raw token for set-password E2E; must match apps/web/e2e/helpers/setPasswordToken.ts */
const E2E_SET_PASSWORD_TOKEN_RAW = 'e2e1' + '0'.repeat(28);
/** Raw token for verify-email E2E; must match apps/web/e2e/helpers/verifyEmailToken.ts */
const E2E_VERIFY_EMAIL_TOKEN_RAW = 'e2e2' + '0'.repeat(28);
/** Raw token for confirm-email-change E2E; must match apps/web/e2e/helpers/confirmEmailChangeToken.ts */
const E2E_CONFIRM_EMAIL_CHANGE_TOKEN_RAW = 'e2e3' + '0'.repeat(28);
const E2E_DISPLAY_NAME = 'E2E Bucket Owner';
const E2E_DISPLAY_NAME2 = 'E2E Bucket Admin';
const E2E_DISPLAY_NAME3 = 'E2E Admin Without Permission';
const E2E_DISPLAY_NAME4 = 'E2E Non Admin';
const E2E_DISPLAY_NAME5 = 'E2E Invite';
/** Full CRUD (create=1, read=2, update=4, delete=8) so admin can manage bucket admins. */
const BUCKET_CRUD_FULL = 15;
/** Read only; cannot manage bucket admins. */
const BUCKET_CRUD_READ = 2;

async function main() {
  const passwordHash = await bcrypt.hash(E2E_PASSWORD_PLAIN, 10);
  const client = new pg.Client({
    host: DB_HOST,
    port: DB_PORT,
    database: dbAppName,
    user: DB_USER,
    password: DB_PASSWORD,
  });
  await client.connect();
  try {
    await client.query('TRUNCATE "user" RESTART IDENTITY CASCADE;');
    await client.query(
      `INSERT INTO "user" (id, short_id, email_verified_at, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW(), NOW())`,
      [E2E_USER_ID, E2E_USER_SHORT_ID]
    );
    await client.query(
      `INSERT INTO user_credentials (user_id, email, password_hash) VALUES ($1, $2, $3)`,
      [E2E_USER_ID, E2E_EMAIL, passwordHash]
    );
    await client.query(`INSERT INTO user_bio (user_id, display_name) VALUES ($1, $2)`, [
      E2E_USER_ID,
      E2E_DISPLAY_NAME,
    ]);
    await client.query(
      `INSERT INTO "user" (id, short_id, email_verified_at, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW(), NOW())`,
      [E2E_USER2_ID, E2E_USER2_SHORT_ID]
    );
    await client.query(
      `INSERT INTO user_credentials (user_id, email, password_hash) VALUES ($1, $2, $3)`,
      [E2E_USER2_ID, E2E_EMAIL2, passwordHash]
    );
    await client.query(`INSERT INTO user_bio (user_id, display_name) VALUES ($1, $2)`, [
      E2E_USER2_ID,
      E2E_DISPLAY_NAME2,
    ]);
    await client.query(
      `INSERT INTO "user" (id, short_id, email_verified_at, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW(), NOW())`,
      [E2E_USER3_ID, E2E_USER3_SHORT_ID]
    );
    await client.query(
      `INSERT INTO user_credentials (user_id, email, password_hash) VALUES ($1, $2, $3)`,
      [E2E_USER3_ID, E2E_EMAIL3, passwordHash]
    );
    await client.query(`INSERT INTO user_bio (user_id, display_name) VALUES ($1, $2)`, [
      E2E_USER3_ID,
      E2E_DISPLAY_NAME3,
    ]);
    await client.query(
      `INSERT INTO "user" (id, short_id, email_verified_at, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW(), NOW())`,
      [E2E_USER4_ID, E2E_USER4_SHORT_ID]
    );
    await client.query(
      `INSERT INTO user_credentials (user_id, email, password_hash) VALUES ($1, $2, $3)`,
      [E2E_USER4_ID, E2E_EMAIL4, passwordHash]
    );
    await client.query(`INSERT INTO user_bio (user_id, display_name) VALUES ($1, $2)`, [
      E2E_USER4_ID,
      E2E_DISPLAY_NAME4,
    ]);
    await client.query(
      `INSERT INTO "user" (id, short_id, email_verified_at, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW(), NOW())`,
      [E2E_USER5_ID, E2E_USER5_SHORT_ID]
    );
    await client.query(
      `INSERT INTO user_credentials (user_id, email, password_hash) VALUES ($1, $2, $3)`,
      [E2E_USER5_ID, E2E_EMAIL5, passwordHash]
    );
    await client.query(`INSERT INTO user_bio (user_id, display_name) VALUES ($1, $2)`, [
      E2E_USER5_ID,
      E2E_DISPLAY_NAME5,
    ]);
    await client.query(
      `INSERT INTO bucket (id, owner_id, name, is_public, parent_bucket_id, short_id, created_at, updated_at)
       VALUES ($1, $2, 'E2E Bucket One', true, NULL, $3, NOW(), NOW())`,
      [E2E_BUCKET1_ID, E2E_USER_ID, E2E_BUCKET1_SHORT_ID]
    );
    await client.query(
      `INSERT INTO bucket (id, owner_id, name, is_public, parent_bucket_id, short_id, created_at, updated_at)
       VALUES ($1, $2, 'E2E Bucket Two', false, NULL, $3, NOW(), NOW())`,
      [E2E_BUCKET2_ID, E2E_USER_ID, E2E_BUCKET2_SHORT_ID]
    );
    await client.query(
      `INSERT INTO bucket_admin (bucket_id, user_id, bucket_crud, bucket_messages_crud, bucket_admins_crud, created_at)
       VALUES ($1, $2, $3, 2, 2, NOW())`,
      [E2E_BUCKET1_ID, E2E_USER2_ID, BUCKET_CRUD_FULL]
    );
    await client.query(
      `INSERT INTO bucket_admin (bucket_id, user_id, bucket_crud, bucket_messages_crud, bucket_admins_crud, created_at)
       VALUES ($1, $2, $3, 2, 2, NOW())`,
      [E2E_BUCKET1_ID, E2E_USER3_ID, BUCKET_CRUD_READ]
    );
    await client.query(
      `INSERT INTO bucket_admin (bucket_id, user_id, bucket_crud, bucket_messages_crud, bucket_admins_crud, created_at)
       VALUES ($1, $2, $3, 2, 2, NOW())`,
      [E2E_BUCKET1_ID, E2E_USER_ID, BUCKET_CRUD_FULL]
    );
    const setPasswordTokenHash = crypto
      .createHash('sha256')
      .update(E2E_SET_PASSWORD_TOKEN_RAW, 'utf8')
      .digest('hex');
    const setPasswordExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await client.query(
      `INSERT INTO verification_token (user_id, kind, token_hash, expires_at, payload)
       VALUES ($1, 'set_password', $2, $3::timestamp, NULL)`,
      [E2E_USER5_ID, setPasswordTokenHash, setPasswordExpiresAt]
    );
    const verifyEmailTokenHash = crypto
      .createHash('sha256')
      .update(E2E_VERIFY_EMAIL_TOKEN_RAW, 'utf8')
      .digest('hex');
    const verifyEmailExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await client.query(
      `INSERT INTO verification_token (user_id, kind, token_hash, expires_at, payload)
       VALUES ($1, 'email_verify', $2, $3::timestamp, NULL)`,
      [E2E_USER_ID, verifyEmailTokenHash, verifyEmailExpiresAt]
    );
    const confirmEmailChangeTokenHash = crypto
      .createHash('sha256')
      .update(E2E_CONFIRM_EMAIL_CHANGE_TOKEN_RAW, 'utf8')
      .digest('hex');
    const confirmEmailChangeExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const emailChangePayload = JSON.stringify({ pending_email: E2E_EMAIL });
    await client.query(
      `INSERT INTO verification_token (user_id, kind, token_hash, expires_at, payload)
       VALUES ($1, 'email_change', $2, $3::timestamp, $4::jsonb)`,
      [E2E_USER_ID, confirmEmailChangeTokenHash, confirmEmailChangeExpiresAt, emailChangePayload]
    );
    console.log(
      'E2E web seed done: 5 users (owner, admin-with-permission, admin-without-permission, non-admin, invite), 2 buckets, 3 bucket admins, set_password, email_verify, and email_change tokens.'
    );
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('tools/web/seed-e2e.mjs:', err.message);
  process.exit(1);
});
