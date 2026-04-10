import dotenv from 'dotenv';
/**
 * CLI for generate-data: seeds main and/or management DB with faker-generated test data.
 * Load env before importing ORM so DataSources see process.env.
 *
 * Usage: node dist/cli.js <main|management|both> [--rows N]
 * Default rows: 100.
 */
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// dist/cli.js -> tools/generate-data/dist; need three levels up to reach monorepo root
const repoRoot = path.resolve(__dirname, '..', '..', '..');

type Target = 'main' | 'management' | 'both';

const DEFAULT_ROWS = 100;

function parseArgs(): { target: Target; rows: number } {
  const args = process.argv.slice(2);
  let target: Target | null = null;
  let rows = DEFAULT_ROWS;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--rows' || arg === '-n') {
      const next = args[i + 1];
      if (next === undefined) {
        console.error('--rows / -n requires a number');
        process.exit(1);
      }
      const n = Number.parseInt(next, 10);
      if (Number.isNaN(n) || n < 1) {
        console.error('--rows must be a positive integer');
        process.exit(1);
      }
      rows = n;
      i += 1;
    } else if (arg === 'main' || arg === 'management' || arg === 'both') {
      target = arg;
    }
  }

  if (target === null) {
    console.error(
      'Usage: node dist/cli.js <main|management|both> [--rows N]\n' +
        '  main       – seed main DB (user, user_credentials, user_bio)\n' +
        '  management – seed management DB (management_user, credentials, bio, admin_permissions)\n' +
        '  both       – seed both DBs\n' +
        '  --rows N   – number of rows (default 100)'
    );
    process.exit(1);
  }

  return { target, rows };
}

async function main(): Promise<void> {
  const { target, rows } = parseArgs();

  if (target === 'main' || target === 'both') {
    dotenv.config({ path: path.join(repoRoot, 'apps', 'api', '.env') });
  }
  if (target === 'management' || target === 'both') {
    dotenv.config({ path: path.join(repoRoot, 'apps', 'management-api', '.env') });
  }

  if (target === 'main' || target === 'both') {
    const { seedMain } = await import('./main/seed.js');
    await seedMain(rows);
  }
  if (target === 'management' || target === 'both') {
    const { seedManagement } = await import('./management/seed.js');
    await seedManagement(rows);
  }

  process.stdout.write('Done.\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
