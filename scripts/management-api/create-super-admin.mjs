import { randomBytes } from 'crypto';
import path from 'path';
/**
 * Create the super admin user in the management database (used by make local_infra_up).
 *
 * Run from repo root: node scripts/management-api/create-super-admin.mjs
 * In-cluster (image with script baked in): node /app/scripts/management-api/create-super-admin.mjs
 *
 * Loads .env from apps/management-api (same DB_* keys as management-api: DB_HOST, DB_PORT,
 * DB_MANAGEMENT_NAME, DB_MANAGEMENT_READ_WRITE_USER, DB_MANAGEMENT_READ_WRITE_PASSWORD) plus optional bootstrap vars.
 *
 * Credential source (first match):
 * 1. LOCAL_SUPERADMIN_PASSWORD — username fixed to "superadmin" (e.g. make testSuperAdmin=1; local/CI only).
 * 2. DB_MANAGEMENT_SUPERUSER_USERNAME + DB_MANAGEMENT_SUPERUSER_PASSWORD both non-empty — non-interactive
 *    (from db-management-superuser.env via local_env_setup).
 * 3. Interactive TTY: prompt for username, generate password. Non-TTY: username superadmin + generated password.
 */
import { createInterface } from 'readline';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');

async function loadEnv() {
  const dotenv = await import('dotenv');
  const envPath = path.join(repoRoot, 'apps', 'management-api', '.env');
  dotenv.config({ path: envPath });
}

function readLine(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

const DEFAULT_USERNAME = 'superadmin';

function isValidUsername(username) {
  return typeof username === 'string' && username.trim().length > 0 && username.length <= 50;
}

async function promptUsername() {
  const isTty = process.stdin.isTTY === true;

  const blurb = [
    '',
    'The super admin is the initial management user with full access (admins, users, settings).',
    'You will be prompted for a username; a strong password will be generated and shown once.',
    '',
  ].join('\n');

  if (isTty) {
    process.stdout.write(blurb);
    const raw = await readLine(`Username for super admin (blank = ${DEFAULT_USERNAME}): `);
    const username = (raw === '' ? DEFAULT_USERNAME : raw).trim();
    if (!isValidUsername(username)) {
      console.error(
        'Invalid username. Use a non-empty string (max 50 chars) or leave blank for superadmin.'
      );
      process.exit(1);
    }
    return username;
  }

  return DEFAULT_USERNAME;
}

function generatePassword() {
  return randomBytes(24)
    .toString('base64')
    .replace(/[/+=]/g, (c) => {
      const map = { '/': '_', '+': '-', '=': '' };
      return map[c] ?? c;
    });
}

/** @typedef {'test' | 'env' | 'interactive'} PasswordSource */

async function main() {
  await loadEnv();

  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT ?? '5532';
  const database = process.env.DB_MANAGEMENT_NAME;
  const user = process.env.DB_MANAGEMENT_READ_WRITE_USER;
  const password = process.env.DB_MANAGEMENT_READ_WRITE_PASSWORD;

  if (!host || !database || !user) {
    console.error(
      'Missing DB_HOST, DB_MANAGEMENT_NAME, or DB_MANAGEMENT_READ_WRITE_USER. Set apps/management-api/.env (e.g. make local_env_setup).'
    );
    process.exit(1);
  }

  const localTestPassword = process.env.LOCAL_SUPERADMIN_PASSWORD;
  const envSuUser = (process.env.DB_MANAGEMENT_SUPERUSER_USERNAME ?? '').trim();
  const envSuPass = process.env.DB_MANAGEMENT_SUPERUSER_PASSWORD ?? '';

  /** @type {string} */
  let username;
  /** @type {string} */
  let plainPassword;
  /** @type {PasswordSource} */
  let passwordSource;

  if (typeof localTestPassword === 'string' && localTestPassword.length > 0) {
    username = DEFAULT_USERNAME;
    plainPassword = localTestPassword;
    passwordSource = 'test';
  } else if (envSuUser.length > 0 && envSuPass.length > 0) {
    if (!isValidUsername(envSuUser)) {
      console.error(
        'Invalid DB_MANAGEMENT_SUPERUSER_USERNAME. Use a non-empty string (max 50 chars).'
      );
      process.exit(1);
    }
    username = envSuUser;
    plainPassword = envSuPass;
    passwordSource = 'env';
  } else {
    username = await promptUsername();
    plainPassword = generatePassword();
    passwordSource = 'interactive';
  }

  const bcrypt = (await import('bcrypt')).default;
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  const { v4: uuidv4 } = await import('uuid');
  const id = uuidv4();

  const pg = (await import('pg')).default;
  const client = new pg.Client({
    host,
    port: Number.parseInt(port, 10),
    database,
    user,
    password: password || undefined,
  });

  try {
    await client.connect();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Could not connect to management database:', message);
    process.exit(1);
  }

  try {
    const existing = await client.query(
      'SELECT id FROM management_user WHERE is_super_admin = true LIMIT 1'
    );
    if (existing.rows.length > 0) {
      console.log('Super admin already exists. No action taken.');
      return;
    }

    await client.query('BEGIN');
    try {
      await client.query(
        `INSERT INTO management_user (id, is_super_admin, created_by)
         VALUES ($1, true, NULL)`,
        [id]
      );
      await client.query(
        `INSERT INTO management_user_credentials (management_user_id, username, password_hash)
         VALUES ($1, $2, $3)`,
        [id, username, passwordHash]
      );
      await client.query(
        `INSERT INTO management_user_bio (management_user_id, display_name)
         VALUES ($1, 'Super Admin')`,
        [id]
      );
      await client.query('COMMIT');
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    }

    console.log('');
    console.log('Super admin created.');
    console.log('Username:', username);
    if (passwordSource === 'test') {
      console.log('Password (from LOCAL_SUPERADMIN_PASSWORD; local-only):');
      console.log('  ' + plainPassword);
    } else if (passwordSource === 'env') {
      console.log(
        'Password (from DB_MANAGEMENT_SUPERUSER_PASSWORD; save locally; not for production):'
      );
      console.log('  ' + plainPassword);
    } else {
      console.log('Password (save this; it will not be shown again):');
      console.log('  ' + plainPassword);
    }
    console.log('');
    console.log('Management-web login: use the username above and the password.');
    console.log('You can change this password later in the management app settings.');
    console.log('');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Failed to create super admin:', message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
