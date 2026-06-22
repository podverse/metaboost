/**
 * Runs near-expiry renewal orchestration against the configured app database.
 * Loads env from apps/api/.env and infra/config/local/db.env (override).
 *
 * Usage (from repo root, after `npm run build:packages` and `npm run build -w @metaboost/orm`):
 *   node scripts/api/process-due-renewals.mjs
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');

dotenv.config({ path: path.join(repoRoot, 'apps', 'api', '.env') });
dotenv.config({ path: path.join(repoRoot, 'infra', 'config', 'local', 'db.env'), override: true });

const { appDataSourceReadWrite, BillingRenewalOrchestratorService } =
  await import('@metaboost/orm');

await appDataSourceReadWrite.initialize();
try {
  const orchestrator = new BillingRenewalOrchestratorService();
  const summary = await orchestrator.processDueRenewals({
    now: new Date(),
    lookaheadHours: 24,
  });
  console.log(JSON.stringify(summary));
} finally {
  await appDataSourceReadWrite.destroy();
}
