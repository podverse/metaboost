import type { AppRegistryService } from './appRegistry/AppRegistryService.js';
import type { RegistryAppRecord } from './appRegistry/types.js';

import { GlobalBlockedAppService } from '@metaboost/orm';

import { isAppIdBlockedForTargetBucket } from './blocked-app-scope.js';

export type AppBlockReason =
  | 'app_not_registered'
  | 'registry_unavailable'
  | 'app_registry_blocked'
  | 'app_global_blocked'
  | 'app_bucket_blocked';

export type AppPostingPolicyDecision = {
  appId: string;
  allowed: boolean;
  reason?: AppBlockReason;
  message?: string;
  registryRecord?: RegistryAppRecord;
};

export function getAppBlockedMessage(reason: AppBlockReason): string {
  switch (reason) {
    case 'app_not_registered':
      return 'This app is not registered in the Metaboost app registry.';
    case 'registry_unavailable':
      return 'The Metaboost app registry is currently unavailable.';
    case 'app_registry_blocked':
      return 'This app has been suspended or revoked in the Metaboost app registry.';
    case 'app_global_blocked':
      return 'This app is blocked site-wide on this Metaboost server.';
    case 'app_bucket_blocked':
      return 'This app is blocked for this bucket.';
  }
}

export async function evaluateAppPostingPolicy(options: {
  targetBucketId: string;
  appIdRaw: string;
  registry: AppRegistryService;
}): Promise<AppPostingPolicyDecision> {
  const appId = options.appIdRaw.trim();
  const loaded = await options.registry.loadAppRecord(appId);
  if (!loaded.ok) {
    const reason: AppBlockReason =
      loaded.reason === 'not_found' ? 'app_not_registered' : 'registry_unavailable';
    return {
      appId,
      allowed: false,
      reason,
      message: getAppBlockedMessage(reason),
    };
  }

  const { record } = loaded;
  if (record.status === 'suspended' || record.status === 'revoked') {
    return {
      appId,
      allowed: false,
      reason: 'app_registry_blocked',
      message: getAppBlockedMessage('app_registry_blocked'),
      registryRecord: record,
    };
  }

  if (await GlobalBlockedAppService.isBlocked(appId)) {
    return {
      appId,
      allowed: false,
      reason: 'app_global_blocked',
      message: getAppBlockedMessage('app_global_blocked'),
      registryRecord: record,
    };
  }

  if (await isAppIdBlockedForTargetBucket(options.targetBucketId, appId)) {
    return {
      appId,
      allowed: false,
      reason: 'app_bucket_blocked',
      message: getAppBlockedMessage('app_bucket_blocked'),
      registryRecord: record,
    };
  }

  return {
    appId,
    allowed: true,
    registryRecord: record,
  };
}
