import type {
  ScenarioPack,
  SeedMode,
  SeedRuntimeOptions,
  SeedTarget,
  VolumeProfile,
} from './types.js';

import dotenv from 'dotenv';
/**
 * CLI for generate-data: seeds main and/or management DB with faker-generated test data.
 * Load env before importing ORM so DataSources see process.env.
 *
 * Usage: node dist/cli.js <main|management|both> [options]
 */
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// dist/cli.js -> tools/generate-data/dist; need three levels up to reach monorepo root
const repoRoot = path.resolve(__dirname, '..', '..', '..');

const DEFAULT_ROWS = 100;
const DEFAULT_PROFILE: VolumeProfile = 'small';
const DEFAULT_SCENARIO_PACK: ScenarioPack = 'full';
const DEFAULT_SEED = 20260414;

function parseProfile(value: string): VolumeProfile {
  if (value === 'small' || value === 'medium' || value === 'large' || value === 'xl') {
    return value;
  }
  throw new Error(`Invalid --profile value "${value}". Expected small|medium|large|xl.`);
}

function parseScenarioPack(value: string): ScenarioPack {
  if (
    value === 'main' ||
    value === 'management' ||
    value === 'full' ||
    value === 'rss-heavy' ||
    value === 'messages-heavy' ||
    value === 'authz-heavy'
  ) {
    return value;
  }
  throw new Error(
    `Invalid --scenarioPack value "${value}". Expected main|management|full|rss-heavy|messages-heavy|authz-heavy.`
  );
}

function printUsage(): void {
  console.error(
    'Usage: node dist/cli.js <main|management|both> [options]\n' +
      '  --rows, -n <N>        Number of base rows (default 100)\n' +
      '  --profile <name>      small|medium|large|xl (default small)\n' +
      '  --seed <N>            Faker seed (default 20260414)\n' +
      '  --scenarioPack <name> main|management|full|rss-heavy|messages-heavy|authz-heavy\n' +
      '  --namespace <name>    Prefix for generated records (default gd-<timestamp>)\n' +
      '  --truncate            Truncate target DB tables before seeding\n' +
      '  --append              Append mode (default)\n' +
      '  --allowTestDb         Allow seeding likely test DB names\n' +
      '  --skipValidation      Skip post-seed scenario validation checks\n' +
      '  --help                Show this help\n'
  );
}

function parseArgs(): { target: SeedTarget; options: SeedRuntimeOptions } {
  const args = process.argv.slice(2);
  let target: SeedTarget | null = null;
  let rows = DEFAULT_ROWS;
  let profile = DEFAULT_PROFILE;
  let scenarioPack = DEFAULT_SCENARIO_PACK;
  let seed = DEFAULT_SEED;
  let namespace = `gd-${Date.now()}`;
  let mode: SeedMode = 'append';
  let allowTestDb = false;
  let validate = true;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--help') {
      printUsage();
      process.exit(0);
    } else if (arg === '--rows' || arg === '-n') {
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
    } else if (arg === '--profile') {
      const next = args[i + 1];
      if (next === undefined) {
        console.error('--profile requires a value');
        process.exit(1);
      }
      try {
        profile = parseProfile(next);
      } catch (error) {
        console.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
      i += 1;
    } else if (arg === '--seed') {
      const next = args[i + 1];
      if (next === undefined) {
        console.error('--seed requires a number');
        process.exit(1);
      }
      const parsedSeed = Number.parseInt(next, 10);
      if (Number.isNaN(parsedSeed)) {
        console.error('--seed must be an integer');
        process.exit(1);
      }
      seed = parsedSeed;
      i += 1;
    } else if (arg === '--scenarioPack') {
      const next = args[i + 1];
      if (next === undefined) {
        console.error('--scenarioPack requires a value');
        process.exit(1);
      }
      try {
        scenarioPack = parseScenarioPack(next);
      } catch (error) {
        console.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
      i += 1;
    } else if (arg === '--namespace') {
      const next = args[i + 1];
      if (next === undefined || next.trim().length === 0) {
        console.error('--namespace requires a non-empty value');
        process.exit(1);
      }
      namespace = next.trim();
      i += 1;
    } else if (arg === '--truncate') {
      mode = 'truncate';
    } else if (arg === '--append') {
      mode = 'append';
    } else if (arg === '--allowTestDb') {
      allowTestDb = true;
    } else if (arg === '--skipValidation') {
      validate = false;
    } else if (arg === 'main' || arg === 'management' || arg === 'both') {
      target = arg;
    }
  }

  if (target === null) {
    printUsage();
    process.exit(1);
  }

  if (target === 'main' && scenarioPack === 'management') {
    console.error('Scenario pack "management" is not valid for target "main".');
    process.exit(1);
  }
  if (target === 'management' && scenarioPack === 'main') {
    console.error('Scenario pack "main" is not valid for target "management".');
    process.exit(1);
  }

  return {
    target,
    options: {
      rows,
      profile,
      scenarioPack,
      seed,
      namespace,
      mode,
      allowTestDb,
      validate,
    },
  };
}

async function main(): Promise<void> {
  const { target, options } = parseArgs();

  if (target === 'main' || target === 'both') {
    dotenv.config({ path: path.join(repoRoot, 'apps', 'api', '.env') });
  }
  if (target === 'management' || target === 'both') {
    dotenv.config({ path: path.join(repoRoot, 'apps', 'management-api', '.env') });
  }

  if (target === 'main' || target === 'both') {
    const { seedMain } = await import('./main/seed.js');
    await seedMain(options);
  }
  if (target === 'management' || target === 'both') {
    const { seedManagement } = await import('./management/seed.js');
    await seedManagement(options);
  }

  process.stdout.write('Done.\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
