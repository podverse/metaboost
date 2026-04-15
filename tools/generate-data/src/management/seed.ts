import type { CrudMatrix, SeedRuntimeOptions } from '../types.js';
import type { ActorType, EventVisibility } from '@metaboost/management-orm';

/**
 * Seeds the management DB with diverse personas, permissions, events, and refresh-token permutations.
 * Call only after loading apps/management-api .env so managementDataSource has DB_HOST/DB_PORT and DB_MANAGEMENT_*.
 */
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

import {
  EVENT_ACTIONS,
  managementDataSource,
  AdminPermissions,
  ManagementAdminRole,
  ManagementEvent,
  ManagementRefreshToken,
  ManagementUser,
  ManagementUserBio,
  ManagementUserCredentials,
} from '@metaboost/management-orm';

import {
  assertCrudMask,
  assertPositiveInteger,
  assertString,
  makeNamespacedValue,
} from '../contracts.js';
import { resolveManagementProfileCardinality } from '../types.js';
import {
  cleanupManagementDataSource,
  initializeManagementDataSource,
  truncateManagementData,
} from './data-source.js';

const TEST_PASSWORD_PLAIN = 'Test!1Aa';
const SUPER_ADMIN_USERNAME = 'superadmin';
const EVENT_VISIBILITY_VALUES: EventVisibility[] = ['own', 'all_admins', 'all'];
const EVENT_TARGET_TYPES = ['admin', 'user', 'bucket', 'bucket_message'];
const MANAGEMENT_EVENT_ACTIONS = [
  EVENT_ACTIONS.user.created,
  EVENT_ACTIONS.user.updated,
  EVENT_ACTIONS.user.deleted,
  EVENT_ACTIONS.user.passwordChanged,
  EVENT_ACTIONS.admin.created,
  EVENT_ACTIONS.admin.updated,
  EVENT_ACTIONS.admin.deleted,
  EVENT_ACTIONS.admin.passwordChanged,
] as const;

type AdminPersona =
  | 'full-crud'
  | 'read-only'
  | 'bucket-focused'
  | 'bucket-admin-management-only'
  | 'event-limited';

type SeededAdminUser = {
  id: string;
  isSuperAdmin: boolean;
  displayName: string;
};

const PERSONA_ORDER: AdminPersona[] = [
  'full-crud',
  'read-only',
  'bucket-focused',
  'bucket-admin-management-only',
  'event-limited',
];

function resolvePersona(index: number): AdminPersona {
  const mod = index % PERSONA_ORDER.length;
  if (mod === 0) return 'full-crud';
  if (mod === 1) return 'read-only';
  if (mod === 2) return 'bucket-focused';
  if (mod === 3) return 'bucket-admin-management-only';
  return 'event-limited';
}

let cachedPasswordHash: string | null = null;

async function getPasswordHash(): Promise<string> {
  if (cachedPasswordHash !== null) {
    return cachedPasswordHash;
  }
  cachedPasswordHash = await bcrypt.hash(TEST_PASSWORD_PLAIN, 10);
  return cachedPasswordHash;
}

function truncateDisplayName(value: string): string {
  return value.length > 50 ? value.slice(0, 50) : value;
}

function randomEventVisibility(): EventVisibility {
  return faker.helpers.arrayElement(EVENT_VISIBILITY_VALUES);
}

function randomAction(): string {
  return faker.helpers.arrayElement([...MANAGEMENT_EVENT_ACTIONS]);
}

function randomTokenHash(): string {
  return faker.string.hexadecimal({ length: 64, prefix: '' }).toLowerCase();
}

function personaPermissions(persona: AdminPersona): CrudMatrix {
  if (persona === 'full-crud') {
    return {
      adminsCrud: 15,
      usersCrud: 15,
      bucketsCrud: 15,
      bucketMessagesCrud: 15,
      bucketAdminsCrud: 15,
    };
  }
  if (persona === 'read-only') {
    return {
      adminsCrud: 2,
      usersCrud: 2,
      bucketsCrud: 2,
      bucketMessagesCrud: 2,
      bucketAdminsCrud: 2,
    };
  }
  if (persona === 'bucket-focused') {
    return {
      adminsCrud: 0,
      usersCrud: 2,
      bucketsCrud: 15,
      bucketMessagesCrud: 15,
      bucketAdminsCrud: 7,
    };
  }
  if (persona === 'bucket-admin-management-only') {
    return {
      adminsCrud: 0,
      usersCrud: 0,
      bucketsCrud: 2,
      bucketMessagesCrud: 2,
      bucketAdminsCrud: 15,
    };
  }
  return {
    adminsCrud: 2,
    usersCrud: 2,
    bucketsCrud: 2,
    bucketMessagesCrud: 2,
    bucketAdminsCrud: 0,
  };
}

async function seedManagementEvents(
  namespace: string,
  users: SeededAdminUser[],
  eventsPerAdmin: number
): Promise<number> {
  if (users.length < 1) {
    return 0;
  }
  const eventRepo = managementDataSource.getRepository(ManagementEvent);
  let total = 0;
  for (const actor of users) {
    for (let i = 0; i < eventsPerAdmin; i += 1) {
      const actorType: ActorType = actor.isSuperAdmin ? 'super_admin' : 'admin';
      const hasTarget = i % 4 !== 0;
      const targetType = hasTarget ? faker.helpers.arrayElement(EVENT_TARGET_TYPES) : null;
      const targetId = hasTarget ? faker.helpers.arrayElement(users).id : null;
      const details =
        i % 3 === 0
          ? `GD:${namespace}:event:${actor.id}:${total}`
          : i % 5 === 0
            ? null
            : faker.lorem.sentence();
      const event = eventRepo.create({
        id: uuidv4(),
        actorId: actor.id,
        actorType,
        actorDisplayName: i % 2 === 0 ? actor.displayName : null,
        action: randomAction(),
        targetType,
        targetId,
        timestamp: faker.date.between({
          from: '2025-01-01T00:00:00.000Z',
          to: '2026-04-14T00:00:00.000Z',
        }),
        details,
      });
      await eventRepo.save(event);
      total += 1;
    }
  }
  return total;
}

async function ensureSuperAdmin(passwordHash: string): Promise<void> {
  const existing = await managementDataSource.getRepository(ManagementUser).findOne({
    where: { isSuperAdmin: true },
    select: ['id'],
  });
  if (existing !== null) {
    return;
  }
  await managementDataSource.transaction(async (manager) => {
    await manager.query('SET CONSTRAINTS ALL DEFERRED');
    const id = uuidv4();
    await manager.getRepository(ManagementUser).save(
      manager.getRepository(ManagementUser).create({
        id,
        isSuperAdmin: true,
        createdBy: null,
      })
    );
    await manager.getRepository(ManagementUserCredentials).save(
      manager.getRepository(ManagementUserCredentials).create({
        managementUserId: id,
        username: SUPER_ADMIN_USERNAME,
        passwordHash,
      })
    );
    await manager.getRepository(ManagementUserBio).save(
      manager.getRepository(ManagementUserBio).create({
        managementUserId: id,
        displayName: 'Super Admin',
      })
    );
  });
}

async function validateManagementSeed(namespace: string): Promise<void> {
  const personas = await managementDataSource
    .getRepository(ManagementUserCredentials)
    .createQueryBuilder('credentials')
    .select('COUNT(*)', 'count')
    .where('credentials.username LIKE :prefix', { prefix: `${namespace}-%` })
    .getRawOne<{ count: string }>();
  if (personas === null || personas === undefined || Number.parseInt(personas.count, 10) < 1) {
    throw new Error(`Validation failed: no management users seeded for namespace "${namespace}".`);
  }

  const permissionSpread = await managementDataSource
    .getRepository(AdminPermissions)
    .createQueryBuilder('permissions')
    .innerJoin(ManagementUser, 'user', 'user.id = permissions.admin_id')
    .innerJoin(ManagementUserCredentials, 'credentials', 'credentials.management_user_id = user.id')
    .select('MIN(permissions.admins_crud)', 'minAdminsCrud')
    .addSelect('MAX(permissions.admins_crud)', 'maxAdminsCrud')
    .addSelect('MIN(permissions.buckets_crud)', 'minBucketsCrud')
    .addSelect('MAX(permissions.buckets_crud)', 'maxBucketsCrud')
    .where('credentials.username LIKE :prefix', { prefix: `${namespace}-%` })
    .getRawOne<{
      minAdminsCrud: string;
      maxAdminsCrud: string;
      minBucketsCrud: string;
      maxBucketsCrud: string;
    }>();
  if (
    permissionSpread === null ||
    permissionSpread === undefined ||
    Number.parseInt(permissionSpread.maxAdminsCrud, 10) < 2 ||
    Number.parseInt(permissionSpread.maxBucketsCrud, 10) < 2
  ) {
    throw new Error(
      `Validation failed: permission spread too narrow for namespace "${namespace}".`
    );
  }

  const eventVariety = await managementDataSource
    .getRepository(ManagementEvent)
    .createQueryBuilder('event')
    .select('COUNT(DISTINCT event.action)', 'actionCount')
    .where('event.details LIKE :prefix', { prefix: `GD:${namespace}:%` })
    .getRawOne<{ actionCount: string }>();
  if (
    eventVariety === null ||
    eventVariety === undefined ||
    Number.parseInt(eventVariety.actionCount, 10) < 3
  ) {
    throw new Error(
      `Validation failed: insufficient management event action variety for "${namespace}".`
    );
  }
}

export async function seedManagement(options: SeedRuntimeOptions): Promise<void> {
  assertPositiveInteger('rows', options.rows);
  assertString('namespace', options.namespace);
  await initializeManagementDataSource(options.allowTestDb);

  faker.seed(options.seed + 71);
  if (options.mode === 'truncate') {
    await truncateManagementData();
  }

  const profile = resolveManagementProfileCardinality(options);
  const passwordHash = await getPasswordHash();
  await ensureSuperAdmin(passwordHash);

  const seededUsers: SeededAdminUser[] = [];
  for (let i = 0; i < profile.admins; i += 1) {
    const persona = resolvePersona(i);
    const permissions = personaPermissions(persona);
    assertCrudMask('adminsCrud', permissions.adminsCrud);
    assertCrudMask('usersCrud', permissions.usersCrud);
    assertCrudMask('bucketsCrud', permissions.bucketsCrud);
    assertCrudMask('bucketMessagesCrud', permissions.bucketMessagesCrud);
    assertCrudMask('bucketAdminsCrud', permissions.bucketAdminsCrud);

    await managementDataSource.transaction(async (manager) => {
      await manager.query('SET CONSTRAINTS ALL DEFERRED');
      const id = uuidv4();
      const displayName = truncateDisplayName(
        makeNamespacedValue(options.namespace, `${persona.replaceAll('-', ' ')} ${i + 1}`)
      );
      await manager.getRepository(ManagementUser).save(
        manager.getRepository(ManagementUser).create({
          id,
          isSuperAdmin: false,
          createdBy: null,
        })
      );
      await manager.getRepository(ManagementUserCredentials).save(
        manager.getRepository(ManagementUserCredentials).create({
          managementUserId: id,
          username: makeNamespacedValue(options.namespace, `${persona}-${i}`),
          passwordHash,
        })
      );
      await manager.getRepository(ManagementUserBio).save(
        manager.getRepository(ManagementUserBio).create({
          managementUserId: id,
          displayName,
        })
      );
      await manager.getRepository(AdminPermissions).save(
        manager.getRepository(AdminPermissions).create({
          adminId: id,
          adminsCrud: permissions.adminsCrud,
          usersCrud: permissions.usersCrud,
          bucketsCrud: permissions.bucketsCrud,
          bucketMessagesCrud: permissions.bucketMessagesCrud,
          bucketAdminsCrud: permissions.bucketAdminsCrud,
          eventVisibility: persona === 'event-limited' ? 'own' : randomEventVisibility(),
        })
      );
      seededUsers.push({ id, isSuperAdmin: false, displayName });
    });
  }

  const roleRepo = managementDataSource.getRepository(ManagementAdminRole);
  for (let i = 0; i < profile.adminRoles; i += 1) {
    await roleRepo.save(
      roleRepo.create({
        name: makeNamespacedValue(options.namespace, `role-${i}`),
        adminsCrud: faker.helpers.arrayElement([2, 3, 6, 7, 15]),
        usersCrud: faker.helpers.arrayElement([2, 3, 6, 7, 15]),
        bucketsCrud: faker.helpers.arrayElement([2, 3, 6, 7, 15]),
        bucketMessagesCrud: faker.helpers.arrayElement([2, 3, 6, 7, 15]),
        bucketAdminsCrud: faker.helpers.arrayElement([2, 3, 6, 7, 15]),
        eventVisibility: randomEventVisibility(),
      })
    );
  }

  const eventCount = await seedManagementEvents(
    options.namespace,
    seededUsers,
    profile.eventsPerAdmin
  );

  if (options.scenarioPack === 'authz-heavy' || options.scenarioPack === 'full') {
    const refreshRepo = managementDataSource.getRepository(ManagementRefreshToken);
    for (const user of seededUsers) {
      for (let i = 0; i < profile.refreshTokensPerAdmin; i += 1) {
        await refreshRepo.save(
          refreshRepo.create({
            managementUserId: user.id,
            tokenHash: randomTokenHash(),
            expiresAt: faker.date.soon({ days: 20 + i }),
          })
        );
      }
    }
  }

  if (options.validate) {
    await validateManagementSeed(options.namespace);
  }

  process.stdout.write(
    `Seeded management DB (${options.namespace}): admins=${seededUsers.length}, roles=${profile.adminRoles}, events=${eventCount}.\n`
  );
  await cleanupManagementDataSource();
}
