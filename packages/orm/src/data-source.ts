import type { DataSourceOptions } from 'typeorm';

/**
 * TypeORM DataSources: read-only (DB_APP_READ_*) and read-write (DB_APP_READ_WRITE_*).
 * Use the read connection in service methods that only read; use read-write where writes occur.
 * Validate DB_APP_READ_* and DB_APP_READ_WRITE_* at app startup before using.
 */
import { DataSource } from 'typeorm';

import { Bucket } from './entities/Bucket.js';
import { BucketAdmin } from './entities/BucketAdmin.js';
import { BucketAdminInvitation } from './entities/BucketAdminInvitation.js';
import { BucketBlockedApp } from './entities/BucketBlockedApp.js';
import { BucketBlockedSender } from './entities/BucketBlockedSender.js';
import { BucketMessage } from './entities/BucketMessage.js';
import { BucketMessageAppMeta } from './entities/BucketMessageAppMeta.js';
import { BucketMessageValue } from './entities/BucketMessageValue.js';
import { BucketRole } from './entities/BucketRole.js';
import { BucketRSSChannelInfo } from './entities/BucketRSSChannelInfo.js';
import { BucketRSSItemInfo } from './entities/BucketRSSItemInfo.js';
import { BucketSettings } from './entities/BucketSettings.js';
import { GlobalBlockedApp } from './entities/GlobalBlockedApp.js';
import { RefreshToken } from './entities/RefreshToken.js';
import { TermsVersion } from './entities/TermsVersion.js';
import { User } from './entities/User.js';
import { UserBio } from './entities/UserBio.js';
import { UserCredentials } from './entities/UserCredentials.js';
import { UserTermsAcceptance } from './entities/UserTermsAcceptance.js';
import { VerificationToken } from './entities/VerificationToken.js';

const ENTITIES = [
  User,
  UserCredentials,
  UserBio,
  TermsVersion,
  UserTermsAcceptance,
  VerificationToken,
  RefreshToken,
  Bucket,
  BucketSettings,
  BucketAdmin,
  BucketAdminInvitation,
  BucketBlockedApp,
  BucketBlockedSender,
  BucketMessage,
  BucketMessageAppMeta,
  BucketMessageValue,
  GlobalBlockedApp,
  BucketRSSChannelInfo,
  BucketRSSItemInfo,
  BucketRole,
];

function getReadOptions(): DataSourceOptions {
  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT;
  const database = process.env.DB_APP_NAME;
  const username = process.env.DB_APP_READ_USER;
  const password = process.env.DB_APP_READ_PASSWORD;
  if (
    host === undefined ||
    port === undefined ||
    database === undefined ||
    username === undefined ||
    password === undefined
  ) {
    throw new Error(
      'Read DataSource requires DB_HOST, DB_PORT, DB_APP_NAME, DB_APP_READ_USER, DB_APP_READ_PASSWORD (validate at startup).'
    );
  }
  return {
    type: 'postgres',
    host,
    port: Number.parseInt(port, 10),
    database,
    username,
    password,
    entities: ENTITIES,
    synchronize: false,
    logging: false,
  };
}

function getReadWriteOptions(): DataSourceOptions {
  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT;
  const database = process.env.DB_APP_NAME;
  const username = process.env.DB_APP_READ_WRITE_USER;
  const password = process.env.DB_APP_READ_WRITE_PASSWORD;
  if (
    host === undefined ||
    port === undefined ||
    database === undefined ||
    username === undefined ||
    password === undefined
  ) {
    throw new Error(
      'Read-write DataSource requires DB_HOST, DB_PORT, DB_APP_NAME, DB_APP_READ_WRITE_USER, DB_APP_READ_WRITE_PASSWORD (validate at startup).'
    );
  }
  return {
    type: 'postgres',
    host,
    port: Number.parseInt(port, 10),
    database,
    username,
    password,
    entities: ENTITIES,
    synchronize: false,
    logging: false,
  };
}

export const appDataSourceRead = new DataSource(getReadOptions());
export const appDataSourceReadWrite = new DataSource(getReadWriteOptions());

/** @deprecated Use appDataSourceRead or appDataSourceReadWrite. Kept for backward compat. */
export const appDataSource = appDataSourceReadWrite;
