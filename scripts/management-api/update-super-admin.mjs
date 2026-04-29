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
  console.log(`Update management superuser.

Usage:
  node scripts/management-api/update-super-admin.mjs
  node scripts/management-api/update-super-admin.mjs --prompt
  node scripts/management-api/update-super-admin.mjs -u <username>
  node scripts/management-api/update-super-admin.mjs -p <password>
  node scripts/management-api/update-super-admin.mjs -u <username> -p <password>
  node scripts/management-api/update-super-admin.mjs --random-password
  node scripts/management-api/update-super-admin.mjs -u <username> --random-password
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

async function resolveDesiredValues(options) {
  if (options.prompt) {
    if (process.stdin.isTTY !== true) {
      throw new Error('Cannot use --prompt in non-interactive mode.');
    }
    const promptedUsername = await readLine(`Username [${DEFAULT_USERNAME}]: `);
    const promptedPassword = await readLine(`Password [${DEFAULT_PASSWORD}]: `);
    return {
      username: promptedUsername || DEFAULT_USERNAME,
      password: promptedPassword || DEFAULT_PASSWORD,
      setUsername: true,
      setPassword: true,
      passwordWasGenerated: false,
    };
  }

  const hasManualInputs = options.usernameProvided || options.passwordProvided;
  if (options.randomPassword) {
    return {
      username: options.usernameProvided ? options.username : DEFAULT_USERNAME,
      password: generatePassword(),
      setUsername: true,
      setPassword: true,
      passwordWasGenerated: true,
    };
  }

  if (hasManualInputs) {
    return {
      username: options.username,
      password: options.password,
      setUsername: options.usernameProvided,
      setPassword: options.passwordProvided,
      passwordWasGenerated: false,
    };
  }

  return {
    username: DEFAULT_USERNAME,
    password: DEFAULT_PASSWORD,
    setUsername: true,
    setPassword: true,
    passwordWasGenerated: false,
  };
}

function getDbConfig() {
  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT ?? '5532';
  const database = process.env.DB_MANAGEMENT_NAME;
  const user =
    process.env.DB_MANAGEMENT_READ_WRITE_USER ||
    process.env.DB_MANAGEMENT_ADMIN_USER ||
    process.env.DB_APP_ADMIN_USER;
  const password =
    process.env.DB_MANAGEMENT_READ_WRITE_PASSWORD ||
    process.env.DB_MANAGEMENT_ADMIN_PASSWORD ||
    process.env.DB_APP_ADMIN_PASSWORD;

  if (!host || !database || !user) {
    throw new Error(
      'Missing DB_HOST, DB_MANAGEMENT_NAME, or management DB credentials (DB_MANAGEMENT_READ_WRITE_* / DB_MANAGEMENT_ADMIN_* / DB_APP_ADMIN_*).'
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
    const desired = await resolveDesiredValues(options);
    if (desired.setUsername && !isValidUsername(desired.username)) {
      throw new Error('Invalid username. Use a non-empty value up to 50 characters.');
    }

    const bcrypt = (await import('bcrypt')).default;
    const pg = (await import('pg')).default;
    const client = new pg.Client(getDbConfig());

    await client.connect();

    try {
      const existing = await client.query(
        `SELECT mu.id, muc.username
         FROM management_user mu
         JOIN management_user_credentials muc ON muc.management_user_id = mu.id
         WHERE mu.is_super_admin = true
         LIMIT 1`
      );

      if (existing.rows.length === 0) {
        const username = desired.setUsername ? desired.username : DEFAULT_USERNAME;
        const plainPassword = desired.setPassword ? desired.password : DEFAULT_PASSWORD;
        const passwordHash = await bcrypt.hash(plainPassword, 10);
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
            [id, username, passwordHash]
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

        console.log('No existing superuser found. Created new superuser.');
        console.log(`Username: ${username}`);
        if (desired.passwordWasGenerated) {
          console.log(`Generated password: ${desired.password}`);
        } else if (desired.setPassword || (!desired.setUsername && !desired.setPassword)) {
          console.log(`Password: ${plainPassword}`);
        }
        return;
      }

      if (!desired.setUsername && !desired.setPassword) {
        console.log('No update options provided; nothing to change.');
        return;
      }

      const managementUserId = existing.rows[0].id;
      const currentUsername = existing.rows[0].username;

      await client.query('BEGIN');
      try {
        if (desired.setUsername) {
          await client.query(
            `UPDATE management_user_credentials
             SET username = $1
             WHERE management_user_id = $2`,
            [desired.username, managementUserId]
          );
        }
        if (desired.setPassword) {
          const passwordHash = await bcrypt.hash(desired.password, 10);
          await client.query(
            `UPDATE management_user_credentials
             SET password_hash = $1
             WHERE management_user_id = $2`,
            [passwordHash, managementUserId]
          );
        }
        await client.query('COMMIT');
      } catch (txError) {
        await client.query('ROLLBACK');
        throw txError;
      }

      console.log('Superuser updated successfully.');
      console.log(`Management user id: ${managementUserId}`);
      console.log(`Old username: ${currentUsername}`);
      console.log(`New username: ${desired.setUsername ? desired.username : currentUsername}`);
      if (desired.setPassword) {
        if (desired.passwordWasGenerated) {
          console.log(`Generated password: ${desired.password}`);
        } else {
          console.log(`Password: ${desired.password}`);
        }
      }
    } finally {
      await client.end();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to update superuser: ${message}`);
    process.exit(1);
  }
}

main();
