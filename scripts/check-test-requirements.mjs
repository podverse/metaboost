#!/usr/bin/env node
/**
 * Check that test requirements (Postgres and Valkey reachable at test ports) are met.
 * If Postgres is up, verify the app test DB schema matches current linear migrations
 * (guards against stale metaboost_app_test after pulls).
 * If not, print instructions (e.g. make test_deps) and exit 1.
 * Used as the first step of `npm run test` from repo root.
 */

import net from 'net';
import pg from 'pg';

const DB_HOST = process.env.DB_HOST ?? 'localhost';
const DB_PORT = Number(process.env.DB_PORT ?? '5632', 10);
const KEYVALDB_HOST = process.env.KEYVALDB_HOST ?? 'localhost';
const KEYVALDB_PORT = Number(process.env.KEYVALDB_PORT ?? '6579', 10);

/** Defaults match apps/api/src/test/setup.ts and makefiles/local/Makefile.local.test.mk */
const DB_APP_NAME = process.env.DB_APP_NAME ?? 'metaboost_app_test';
const DB_APP_READ_WRITE_USER = process.env.DB_APP_READ_WRITE_USER ?? 'metaboost_app_read_write';
const DB_APP_READ_WRITE_PASSWORD = process.env.DB_APP_READ_WRITE_PASSWORD ?? 'test';

function checkPort(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeout = 1000;
    socket.setTimeout(timeout);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('error', () => resolve(false));
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

/**
 * Confirms a column the ORM expects exists — catches outdated test DBs without running Vitest.
 */
async function assertAppTestSchemaHasBoostDisplayFloorColumn() {
  const client = new pg.Client({
    host: DB_HOST,
    port: DB_PORT,
    database: DB_APP_NAME,
    user: DB_APP_READ_WRITE_USER,
    password: DB_APP_READ_WRITE_PASSWORD,
    connectionTimeoutMillis: 3000,
  });
  try {
    await client.connect();
    const { rows } = await client.query(
      `SELECT 1 AS ok
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'bucket_settings'
         AND column_name = 'public_boost_display_minimum_minor'
       LIMIT 1`
    );
    if (rows.length === 0) {
      console.error(
        `Test database "${DB_APP_NAME}" is missing column bucket_settings.public_boost_display_minimum_minor.`
      );
      console.error('The schema is older than the current linear migrations.');
      console.error('');
      console.error('Run from repo root:');
      console.error('  make test_deps');
      console.error('');
      console.error('See: make help_test');
      process.exit(1);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Could not verify test database schema (${DB_APP_NAME}): ${message}`);
    console.error('');
    console.error('Run from repo root:');
    console.error('  make test_deps');
    console.error('');
    console.error('See: make help_test');
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

async function main() {
  const dbOk = await checkPort(DB_HOST, DB_PORT);
  const valkeyOk = await checkPort(KEYVALDB_HOST, KEYVALDB_PORT);

  if (!dbOk || !valkeyOk) {
    const missing = [];
    if (!dbOk) missing.push(`Postgres at ${DB_HOST}:${DB_PORT}`);
    if (!valkeyOk) missing.push(`Valkey at ${KEYVALDB_HOST}:${KEYVALDB_PORT}`);

    console.error('Test requirements not met. The following are not reachable:');
    missing.forEach((m) => console.error('  - ' + m));
    console.error('');
    console.error('Run from repo root:');
    console.error('  make test_deps');
    console.error('');
    console.error(
      'This starts Postgres on port 5632 and Valkey on 6579, creates metaboost_app_test and metaboost_management_test, and applies their schemas.'
    );
    console.error('See: make help_test');
    process.exit(1);
  }

  await assertAppTestSchemaHasBoostDisplayFloorColumn();
}

main();
