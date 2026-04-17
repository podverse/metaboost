import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Do not static-import createApp (or any module that imports config). Config reads
// process.env at load time; we must load .env first, then load config/createApp.

const loadEnv = async (): Promise<void> => {
  if (process.env.NODE_ENV !== 'production') {
    const envPath = path.resolve(__dirname, '..', '.env');
    try {
      const dotenv = await import('dotenv');
      dotenv.config({ path: envPath });
    } catch {
      // dotenv optional in dev
    }
  }
};

const run = async (): Promise<void> => {
  await loadEnv();

  const { validateStartupRequirements } = await import('./lib/startup/validation.js');
  validateStartupRequirements();

  const { appDataSourceRead, appDataSourceReadWrite } = await import('@metaboost/orm');
  await appDataSourceRead.initialize();
  await appDataSourceReadWrite.initialize();

  const { config } = await import('./config/index.js');
  let registryUrl: URL;
  try {
    registryUrl = new URL(config.sEndpointRegistryUrl);
  } catch {
    throw new Error(
      `Invalid Standard Endpoint registry URL (must be absolute http(s)): ${config.sEndpointRegistryUrl}`
    );
  }
  console.warn(
    `Standard Endpoint app registry: ${registryUrl.origin}${registryUrl.pathname} (lookup <base>/<app_id>.app.json)`
  );
  const { createApp } = await import('./app.js');
  const app = createApp();
  const server = app.listen(config.port, () => {
    console.warn(`API listening on port ${config.port}`);
  });

  let shuttingDown = false;
  const onSignal = (): void => {
    if (shuttingDown) return;
    shuttingDown = true;
    server.close(() => {
      void (async (): Promise<void> => {
        try {
          if (appDataSourceReadWrite.isInitialized) {
            await appDataSourceReadWrite.destroy();
          }
          if (appDataSourceRead.isInitialized) {
            await appDataSourceRead.destroy();
          }
          process.exit(0);
        } catch (err) {
          console.error(err);
          process.exit(1);
        }
      })();
    });
  };
  process.on('SIGINT', onSignal);
  process.on('SIGTERM', onSignal);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
