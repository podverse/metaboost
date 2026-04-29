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
const seedDbUser =
  process.env.DB_APP_READ_WRITE_USER ??
  process.env.DB_READ_WRITE_USER ??
  'metaboost_app_read_write';
const seedDbPassword =
  process.env.DB_APP_READ_WRITE_PASSWORD ?? process.env.DB_READ_WRITE_PASSWORD ?? 'test';

const E2E_USER_ID = '11111111-1111-4111-a111-111111111111';
const E2E_BUCKET1_ID = '22222222-2222-4222-a222-222222222222';
const E2E_BUCKET2_ID = '33333333-3333-4333-a333-333333333333';
const E2E_USER2_ID = '44444444-4444-4444-a444-444444444444';
const E2E_USER3_ID = '55555555-5555-4555-a555-555555555555';
const E2E_USER4_ID = '66666666-6666-4666-a666-666666666666';
const E2E_USER5_ID = '77777777-7777-4777-a777-777777777777';
const E2E_USER6_ID = '88888888-8888-4888-a888-888888888888';
const E2E_USER7_ID = '99999999-9999-4999-a999-999999999999';
const E2E_USER8_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const E2E_USER9_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const E2E_USER_ID_TEXT = 'e2eusr000001';
const E2E_USER2_ID_TEXT = 'e2eusr000002';
const E2E_USER3_ID_TEXT = 'e2eusr000003';
const E2E_USER4_ID_TEXT = 'e2eusr000004';
const E2E_USER5_ID_TEXT = 'e2eusr000005';
const E2E_USER6_ID_TEXT = 'e2eusr000006';
const E2E_USER7_ID_TEXT = 'e2eusr000007';
const E2E_USER8_ID_TEXT = 'e2eusr000008';
const E2E_USER9_ID_TEXT = 'e2eusr000009';
const E2E_BUCKET1_ID_TEXT = 'e2ebkt000001';
const E2E_BUCKET2_ID_TEXT = 'e2ebkt000002';
const E2E_EMAIL = 'e2e-bucket-owner@example.com';
const E2E_EMAIL2 = 'e2e-bucket-admin@example.com';
const E2E_EMAIL3 = 'e2e-admin-without-permission@example.com';
const E2E_EMAIL4 = 'e2e-non-admin@example.com';
const E2E_EMAIL5 = 'e2e-invite@example.com';
const E2E_EMAIL6 = 'e2e-terms-accept@example.com';
const E2E_EMAIL7 = 'e2e-terms-delete@example.com';
const E2E_EMAIL8 = 'e2e-settings-delete@example.com';
const E2E_EMAIL9 = 'e2e-terms-upcoming-ux@example.com';
const E2E_PASSWORD_PLAIN = 'Test!1Aa';
const CURRENT_TERMS_ENFORCEMENT_AT = '2026-01-01T00:00:00.000Z';
const LEGACY_TERMS_ENFORCEMENT_AT = '2025-01-01T00:00:00.000Z';
/** Intentionally overdue for lazy rollover tests: upcoming should auto-promote on auth reads. */
const UPCOMING_TERMS_ENFORCEMENT_AT = '2026-01-02T00:00:00.000Z';
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
const E2E_DISPLAY_NAME6 = 'E2E Terms Accept';
const E2E_DISPLAY_NAME7 = 'E2E Terms Delete';
const E2E_DISPLAY_NAME8 = 'E2E Settings Delete';
const E2E_DISPLAY_NAME9 = 'E2E Terms Upcoming UX';
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
    user: seedDbUser,
    password: seedDbPassword,
  });
  await client.connect();
  try {
    // Not cleared by user CASCADE: E2E toggles (global + per-bucket app blocks) must not leak between runs.
    await client.query('TRUNCATE global_blocked_app RESTART IDENTITY;');
    await client.query('TRUNCATE "user" RESTART IDENTITY CASCADE;');
    await client.query(
      `INSERT INTO "user" (id, id_text, email_verified_at, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW(), NOW())`,
      [E2E_USER_ID, E2E_USER_ID_TEXT]
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
      `INSERT INTO "user" (id, id_text, email_verified_at, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW(), NOW())`,
      [E2E_USER2_ID, E2E_USER2_ID_TEXT]
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
      `INSERT INTO "user" (id, id_text, email_verified_at, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW(), NOW())`,
      [E2E_USER3_ID, E2E_USER3_ID_TEXT]
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
      `INSERT INTO "user" (id, id_text, email_verified_at, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW(), NOW())`,
      [E2E_USER4_ID, E2E_USER4_ID_TEXT]
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
      `INSERT INTO "user" (id, id_text, email_verified_at, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW(), NOW())`,
      [E2E_USER5_ID, E2E_USER5_ID_TEXT]
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
      `INSERT INTO "user" (id, id_text, email_verified_at, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW(), NOW())`,
      [E2E_USER6_ID, E2E_USER6_ID_TEXT]
    );
    await client.query(
      `INSERT INTO user_credentials (user_id, email, password_hash) VALUES ($1, $2, $3)`,
      [E2E_USER6_ID, E2E_EMAIL6, passwordHash]
    );
    await client.query(`INSERT INTO user_bio (user_id, display_name) VALUES ($1, $2)`, [
      E2E_USER6_ID,
      E2E_DISPLAY_NAME6,
    ]);
    await client.query(
      `INSERT INTO "user" (id, id_text, email_verified_at, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW(), NOW())`,
      [E2E_USER7_ID, E2E_USER7_ID_TEXT]
    );
    await client.query(
      `INSERT INTO user_credentials (user_id, email, password_hash) VALUES ($1, $2, $3)`,
      [E2E_USER7_ID, E2E_EMAIL7, passwordHash]
    );
    await client.query(`INSERT INTO user_bio (user_id, display_name) VALUES ($1, $2)`, [
      E2E_USER7_ID,
      E2E_DISPLAY_NAME7,
    ]);
    await client.query(
      `INSERT INTO "user" (id, id_text, email_verified_at, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW(), NOW())`,
      [E2E_USER8_ID, E2E_USER8_ID_TEXT]
    );
    await client.query(
      `INSERT INTO user_credentials (user_id, email, password_hash) VALUES ($1, $2, $3)`,
      [E2E_USER8_ID, E2E_EMAIL8, passwordHash]
    );
    await client.query(`INSERT INTO user_bio (user_id, display_name) VALUES ($1, $2)`, [
      E2E_USER8_ID,
      E2E_DISPLAY_NAME8,
    ]);
    await client.query(
      `INSERT INTO "user" (id, id_text, email_verified_at, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW(), NOW())`,
      [E2E_USER9_ID, E2E_USER9_ID_TEXT]
    );
    await client.query(
      `INSERT INTO user_credentials (user_id, email, password_hash) VALUES ($1, $2, $3)`,
      [E2E_USER9_ID, E2E_EMAIL9, passwordHash]
    );
    await client.query(`INSERT INTO user_bio (user_id, display_name) VALUES ($1, $2)`, [
      E2E_USER9_ID,
      E2E_DISPLAY_NAME9,
    ]);
    await client.query('TRUNCATE terms_version RESTART IDENTITY CASCADE;');
    const termsVersionRows = await client.query(
      `INSERT INTO terms_version (
         version_key,
         title,
         content_hash,
         announcement_starts_at,
         enforcement_starts_at,
         status
       )
       VALUES
         ('e2e-legacy-2025', 'E2E Legacy Terms', 'e2e-legacy-2025', NULL, $1::timestamp, 'deprecated'),
         ('e2e-current-2026', 'E2E Current Terms', 'e2e-current-2026', NULL, $2::timestamp, 'current'),
         ('e2e-upcoming-2099', 'E2E Upcoming Terms', 'e2e-upcoming-2099', NULL, $3::timestamp, 'upcoming')
       RETURNING id, version_key`,
      [LEGACY_TERMS_ENFORCEMENT_AT, CURRENT_TERMS_ENFORCEMENT_AT, UPCOMING_TERMS_ENFORCEMENT_AT]
    );
    const legacyVersionId = termsVersionRows.rows.find(
      (row) => row.version_key === 'e2e-legacy-2025'
    )?.id;
    const currentVersionId = termsVersionRows.rows.find(
      (row) => row.version_key === 'e2e-current-2026'
    )?.id;
    const upcomingVersionId = termsVersionRows.rows.find(
      (row) => row.version_key === 'e2e-upcoming-2099'
    )?.id;
    if (
      typeof legacyVersionId !== 'string' ||
      typeof currentVersionId !== 'string' ||
      typeof upcomingVersionId !== 'string'
    ) {
      throw new Error('Failed to seed terms_version rows for E2E');
    }
    const placeholderEn = 'E2E seeded terms body (en-US).';
    const placeholderEs = 'E2E seeded terms body (es).';
    await client.query(
      `INSERT INTO terms_version_content (terms_version_id, content_text_en_us, content_text_es)
       VALUES ($1, $4, $5), ($2, $4, $5), ($3, $4, $5)`,
      [legacyVersionId, currentVersionId, upcomingVersionId, placeholderEn, placeholderEs]
    );
    await client.query(
      `INSERT INTO user_terms_acceptance (user_id, terms_version_id, accepted_at, acceptance_source)
       VALUES ($1, $2, NOW(), 'e2e-seed'),
              ($3, $2, NOW(), 'e2e-seed'),
              ($4, $2, NOW(), 'e2e-seed'),
              ($5, $2, NOW(), 'e2e-seed'),
              ($6, $2, NOW(), 'e2e-seed'),
              ($7, $8, NOW(), 'e2e-seed'),
              ($9, $2, NOW(), 'e2e-seed')`,
      [
        E2E_USER_ID,
        currentVersionId,
        E2E_USER2_ID,
        E2E_USER3_ID,
        E2E_USER4_ID,
        E2E_USER5_ID,
        E2E_USER7_ID,
        legacyVersionId,
        E2E_USER8_ID,
      ]
    );
    // Pre-accept the upcoming version for dashboard personas so that after
    // TermsVersionService.rolloverIfEnforcementPassed (real wall-clock) the promoted
    // current row id still matches a user_terms_acceptance row. Skip user6
    // (terms-accept E2E) and user7 (terms-delete: legacy-only acceptance).
    await client.query(
      `INSERT INTO user_terms_acceptance (user_id, terms_version_id, accepted_at, acceptance_source)
       VALUES ($1, $7, NOW(), 'e2e-seed'),
              ($2, $7, NOW(), 'e2e-seed'),
              ($3, $7, NOW(), 'e2e-seed'),
              ($4, $7, NOW(), 'e2e-seed'),
              ($5, $7, NOW(), 'e2e-seed'),
              ($6, $7, NOW(), 'e2e-seed')`,
      [
        E2E_USER_ID,
        E2E_USER2_ID,
        E2E_USER3_ID,
        E2E_USER4_ID,
        E2E_USER5_ID,
        E2E_USER8_ID,
        upcomingVersionId,
      ]
    );
    await client.query(
      `INSERT INTO bucket (id, owner_id, name, is_public, parent_bucket_id, id_text, created_at, updated_at)
       VALUES ($1, $2, 'E2E Bucket One', true, NULL, $3, NOW(), NOW())`,
      [E2E_BUCKET1_ID, E2E_USER_ID, E2E_BUCKET1_ID_TEXT]
    );
    await client.query(
      `INSERT INTO bucket (id, owner_id, name, is_public, parent_bucket_id, id_text, created_at, updated_at)
       VALUES ($1, $2, 'E2E Bucket Two', false, NULL, $3, NOW(), NOW())`,
      [E2E_BUCKET2_ID, E2E_USER_ID, E2E_BUCKET2_ID_TEXT]
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
      'E2E web seed done: 9 users (owner, admin-with-permission, admin-without-permission, non-admin, invite, terms-accept, terms-delete, settings-delete, terms-upcoming-ux), seeded terms versions (legacy/current/upcoming) and acceptance states, 2 buckets, 3 bucket admins, set_password, email_verify, and email_change tokens.'
    );
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('tools/web/seed-e2e.mjs:', err.message);
  process.exit(1);
});
