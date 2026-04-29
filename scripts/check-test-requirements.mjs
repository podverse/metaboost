#!/usr/bin/env node
/**
 * Check that test requirements (Postgres and Valkey reachable at test ports) are met.
 * If not, print instructions (e.g. make test_deps) and exit 1.
 * Used as the first step of `npm run test` from repo root.
 */

import net from 'net';

const DB_HOST = process.env.DB_HOST ?? 'localhost';
const DB_PORT = Number(process.env.DB_PORT ?? '5632', 10);
const KEYVALDB_HOST = process.env.KEYVALDB_HOST ?? 'localhost';
const KEYVALDB_PORT = Number(process.env.KEYVALDB_PORT ?? '6579', 10);

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

async function main() {
  const dbOk = await checkPort(DB_HOST, DB_PORT, 'Postgres');
  const valkeyOk = await checkPort(KEYVALDB_HOST, KEYVALDB_PORT, 'Valkey');

  if (dbOk && valkeyOk) {
    return;
  }

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

main();
