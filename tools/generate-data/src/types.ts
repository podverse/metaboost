export type SeedTarget = 'main' | 'management' | 'both';

export type VolumeProfile = 'small' | 'medium' | 'large' | 'xl';

export type ScenarioPack =
  | 'main'
  | 'management'
  | 'full'
  | 'rss-heavy'
  | 'messages-heavy'
  | 'authz-heavy';

export type SeedMode = 'append' | 'truncate';

export type CrudMatrix = {
  adminsCrud: number;
  usersCrud: number;
  bucketsCrud: number;
  bucketMessagesCrud: number;
  bucketAdminsCrud: number;
};

export type MainProfileCardinality = {
  users: number;
  topLevelNetworksPerUser: number;
  topLevelChannelsPerUser: number;
  nestedChannelsPerNetwork: number;
  nestedItemsPerChannel: number;
  messagesPerBucket: number;
  invitationsPerRootBucket: number;
};

export type ManagementProfileCardinality = {
  admins: number;
  eventsPerAdmin: number;
  adminRoles: number;
  refreshTokensPerAdmin: number;
};

export type SeedRuntimeOptions = {
  rows: number;
  profile: VolumeProfile;
  scenarioPack: ScenarioPack;
  seed: number;
  namespace: string;
  mode: SeedMode;
  allowTestDb: boolean;
  validate: boolean;
};

export const VOLUME_MULTIPLIER: Record<VolumeProfile, number> = {
  small: 1,
  medium: 2,
  large: 4,
  xl: 8,
};

export function resolveMainProfileCardinality(options: SeedRuntimeOptions): MainProfileCardinality {
  const multiplier = VOLUME_MULTIPLIER[options.profile];
  const rssHeavy = options.scenarioPack === 'rss-heavy' || options.scenarioPack === 'full';
  const messagesHeavy =
    options.scenarioPack === 'messages-heavy' || options.scenarioPack === 'full';
  const authzHeavy = options.scenarioPack === 'authz-heavy' || options.scenarioPack === 'full';

  return {
    users: Math.max(1, options.rows * multiplier),
    topLevelNetworksPerUser: rssHeavy ? 2 : 1,
    topLevelChannelsPerUser: rssHeavy ? 2 : 1,
    nestedChannelsPerNetwork: rssHeavy ? 3 : 2,
    nestedItemsPerChannel: rssHeavy ? 6 : 3,
    messagesPerBucket: messagesHeavy ? 8 : 3,
    invitationsPerRootBucket: authzHeavy ? 4 : 2,
  };
}

export function resolveManagementProfileCardinality(
  options: SeedRuntimeOptions
): ManagementProfileCardinality {
  const multiplier = VOLUME_MULTIPLIER[options.profile];
  const authzHeavy = options.scenarioPack === 'authz-heavy' || options.scenarioPack === 'full';

  return {
    admins: Math.max(1, options.rows * multiplier),
    eventsPerAdmin: authzHeavy ? 8 : 4,
    adminRoles: authzHeavy ? 8 : 4,
    refreshTokensPerAdmin: authzHeavy ? 2 : 1,
  };
}
