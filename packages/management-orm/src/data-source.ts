import type { DataSourceOptions } from 'typeorm';

/**
 * TypeORM DataSource for the management store (Postgres).
 * Uses the same instance as the main app: **`DB_HOST`**, **`DB_PORT`** (from **`db.db`**) and management database
 * **`DB_MANAGEMENT_NAME`** with **`DB_MANAGEMENT_READ_WRITE_USER`** / **`DB_MANAGEMENT_READ_WRITE_PASSWORD`**
 * (from **`db.db-management`**). Run infra/k8s/base/stack/postgres-init/0005_management_schema.sql.frag once.
 */
import { DataSource } from 'typeorm';

import { AdminPermissions } from './entities/AdminPermissions.js';
import { ManagementAdminRole } from './entities/ManagementAdminRole.js';
import { ManagementEvent } from './entities/ManagementEvent.js';
import { ManagementRefreshToken } from './entities/ManagementRefreshToken.js';
import { ManagementUser } from './entities/ManagementUser.js';
import { ManagementUserBio } from './entities/ManagementUserBio.js';
import { ManagementUserCredentials } from './entities/ManagementUserCredentials.js';

function getManagementOptions(): DataSourceOptions {
  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT;
  const database = process.env.DB_MANAGEMENT_NAME;
  const username = process.env.DB_MANAGEMENT_READ_WRITE_USER;
  const password = process.env.DB_MANAGEMENT_READ_WRITE_PASSWORD;
  if (
    host === undefined ||
    host === '' ||
    port === undefined ||
    port === '' ||
    database === undefined ||
    database === '' ||
    username === undefined ||
    username === '' ||
    password === undefined ||
    password === ''
  ) {
    throw new Error(
      'Management DataSource requires DB_HOST, DB_PORT, DB_MANAGEMENT_NAME, DB_MANAGEMENT_READ_WRITE_USER, DB_MANAGEMENT_READ_WRITE_PASSWORD.'
    );
  }
  return {
    type: 'postgres',
    host,
    port: Number.parseInt(port, 10),
    database,
    username,
    password,
    entities: [
      ManagementUser,
      ManagementUserCredentials,
      ManagementUserBio,
      AdminPermissions,
      ManagementAdminRole,
      ManagementEvent,
      ManagementRefreshToken,
    ],
    synchronize: false,
    logging: false,
  };
}

export const managementDataSource = new DataSource(getManagementOptions());
