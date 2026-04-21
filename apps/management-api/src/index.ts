import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const loadEnv = async (): Promise<void> => {
  if (process.env.NODE_ENV !== 'production') {
    try {
      const dotenv = await import('dotenv');
      const envPath = path.resolve(__dirname, '..', '.env');
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

  const { appDataSourceRead, appDataSourceReadWrite, TermsVersionService } =
    await import('@metaboost/orm');
  await appDataSourceRead.initialize();
  await appDataSourceReadWrite.initialize();
  await TermsVersionService.assertConfiguredForStartup();

  const { managementDataSource } = await import('@metaboost/management-orm');
  await managementDataSource.initialize();

  const { config } = await import('./config/index.js');
  const app = (await import('./app.js')).createApp();
  const server = app.listen(config.port, () => {
    console.warn(`Management API listening on port ${config.port}`);
  });

  let shuttingDown = false;
  const onSignal = (): void => {
    if (shuttingDown) return;
    shuttingDown = true;
    server.close(() => {
      void (async (): Promise<void> => {
        try {
          if (managementDataSource.isInitialized) {
            await managementDataSource.destroy();
          }
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
