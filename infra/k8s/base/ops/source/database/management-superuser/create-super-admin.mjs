/* eslint-disable no-console -- CLI script prints help and status */
import { randomBytes, randomUUID } from 'crypto';
import path from 'path';
import { createInterface } from 'readline';
import { fileURLToPath } from 'url';

const DEFAULT_USERNAME = 'superuser';
const DEFAULT_PASSWORD = 'Test!1Aa';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');

async function loadEnv() {
  const dotenv = await import('dotenv');
  const managementEnv = path.join(repoRoot, 'apps', 'management-api', '.env');
  const dbEnv = path.join(repoRoot, 'infra', 'config', 'local', 'db.env');
  dotenv.config({ path: managementEnv });
  dotenv.config({ path: dbEnv, override: true });
}

function printHelp() {
  console.log(`Create management superuser.

Usage:
  node scripts/management-api/create-super-admin.mjs
  node scripts/management-api/create-super-admin.mjs --prompt
  node scripts/management-api/create-super-admin.mjs -u <username> -p <password>
  node scripts/management-api/create-super-admin.mjs -u <username> --random-password
`);
}

function parseArgs(argv) {
  const options = {
    prompt: false,
    randomPassword: false,
    username: '',
    password: '',
    usernameProvided: false,
    passwordProvided: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--prompt') {
      options.prompt = true;
      continue;
    }
    if (arg === '--random-password') {
      options.randomPassword = true;
      continue;
    }
    if (arg === '-u' || arg === '--username') {
      options.username = argv[index + 1] || '';
      options.usernameProvided = true;
      index += 1;
      continue;
    }
    if (arg === '-p' || arg === '--password') {
      options.password = argv[index + 1] || '';
      options.passwordProvided = true;
      index += 1;
      continue;
    }
    if (arg === '-h' || arg === '--help') {
      printHelp();
      process.exit(0);
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  if (options.prompt && options.randomPassword) {
    throw new Error('Cannot combine --prompt with --random-password.');
  }

  return options;
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

function isValidUsername(username) {
  return typeof username === 'string' && username.trim().length > 0 && username.trim().length <= 50;
}

function generatePassword() {
  return randomBytes(24)
    .toString('base64')
    .replace(/[/+=]/g, (char) => {
      if (char === '/') return '_';
      if (char === '+') return '-';
      return '';
    });
}

async function resolveCredentials(options) {
  if (options.prompt) {
    if (process.stdin.isTTY !== true) {
      throw new Error('Cannot use --prompt in non-interactive mode.');
    }
    const promptedUsername = await readLine(`Username [${DEFAULT_USERNAME}]: `);
    const promptedPassword = await readLine(`Password [${DEFAULT_PASSWORD}]: `);
    return {
      username: promptedUsername || DEFAULT_USERNAME,
      password: promptedPassword || DEFAULT_PASSWORD,
      passwordWasGenerated: false,
    };
  }

  const hasManualInputs = options.usernameProvided || options.passwordProvided;
  if (options.randomPassword) {
    return {
      username: options.usernameProvided ? options.username : DEFAULT_USERNAME,
      password: generatePassword(),
      passwordWasGenerated: true,
    };
  }

  if (hasManualInputs) {
    return {
      username: options.usernameProvided ? options.username : DEFAULT_USERNAME,
      password: options.passwordProvided ? options.password : DEFAULT_PASSWORD,
      passwordWasGenerated: false,
    };
  }

  return {
    username: DEFAULT_USERNAME,
    password: DEFAULT_PASSWORD,
    passwordWasGenerated: false,
  };
}

function getDbConfig() {
  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT ?? '5532';
  const database = process.env.DB_MANAGEMENT_NAME;
  const user =
    process.env.DB_MANAGEMENT_READ_WRITE_USER ||
    process.env.DB_MANAGEMENT_OWNER_USER ||
    process.env.DB_MANAGEMENT_MIGRATOR_USER ||
    process.env.DB_APP_OWNER_USER;
  const password =
    process.env.DB_MANAGEMENT_READ_WRITE_PASSWORD ||
    process.env.DB_MANAGEMENT_OWNER_PASSWORD ||
    process.env.DB_MANAGEMENT_MIGRATOR_PASSWORD ||
    process.env.DB_APP_OWNER_PASSWORD;

  if (!host || !database || !user) {
    throw new Error(
      'Missing DB_HOST, DB_MANAGEMENT_NAME, or management DB credentials (DB_MANAGEMENT_READ_WRITE_* / DB_MANAGEMENT_OWNER_* / DB_MANAGEMENT_MIGRATOR_* / DB_APP_OWNER_*).'
    );
  }

  return {
    host,
    port: Number.parseInt(port, 10),
    database,
    user,
    password: password || undefined,
  };
}

async function main() {
  await loadEnv();

  try {
    const options = parseArgs(process.argv.slice(2));
    const credentials = await resolveCredentials(options);

    if (!isValidUsername(credentials.username)) {
      throw new Error('Invalid username. Use a non-empty value up to 50 characters.');
    }

    const bcrypt = (await import('bcrypt')).default;
    const passwordHash = await bcrypt.hash(credentials.password, 10);

    const pg = (await import('pg')).default;
    const client = new pg.Client(getDbConfig());

    await client.connect();

    try {
      const existing = await client.query(
        'SELECT id FROM management_user WHERE is_super_admin = true LIMIT 1'
      );
      if (existing.rows.length > 0) {
        throw new Error('Superuser already exists. Use update-super-admin.mjs instead.');
      }

      const id = randomUUID();

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
          [id, credentials.username, passwordHash]
        );
        await client.query(
          `INSERT INTO management_user_bio (management_user_id, display_name)
           VALUES ($1, 'Super Admin')`,
          [id]
        );
        await client.query('COMMIT');
      } catch (txError) {
        await client.query('ROLLBACK');
        throw txError;
      }

      console.log('Superuser created successfully.');
      console.log(`Username: ${credentials.username}`);
      if (credentials.passwordWasGenerated) {
        console.log(`Generated password: ${credentials.password}`);
      } else {
        console.log(`Password: ${credentials.password}`);
      }
    } finally {
      await client.end();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to create superuser: ${message}`);
    process.exit(1);
  }
}

main();
