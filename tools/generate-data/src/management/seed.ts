import type { ActorType, EventVisibility } from '@boilerplate/management-orm';

/**
 * Seeds the management DB with management_user, credentials, bio, admin_permissions, and management_event.
 * Call only after loading apps/management-api .env so managementDataSource has DB_HOST/DB_PORT and DB_MANAGEMENT_*.
 * Conditionally creates a super admin (username superadmin) only if one does not already exist
 * (e.g. create-super-admin.mjs may have run during local startup). Regular seeded users are
 * always non–super-admin admins.
 * For columns with multiple eligible values (e.g. enums, booleans, nullables), a value is chosen randomly per row.
 */
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

import {
  EVENT_ACTIONS,
  EVENT_TARGET_TYPES,
  managementDataSource,
  AdminPermissions,
  ManagementEvent,
  ManagementUser,
  ManagementUserBio,
  ManagementUserCredentials,
} from '@boilerplate/management-orm';

const TEST_PASSWORD_PLAIN = 'Test!1Aa';
const SUPER_ADMIN_USERNAME = 'superadmin';

const EVENT_VISIBILITY_VALUES: EventVisibility[] = ['own', 'all_admins', 'all'];

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

const TARGET_TYPES = [EVENT_TARGET_TYPES.user, EVENT_TARGET_TYPES.admin] as const;

let cachedPasswordHash: string | null = null;

async function getPasswordHash(): Promise<string> {
  if (cachedPasswordHash !== null) return cachedPasswordHash;
  cachedPasswordHash = await bcrypt.hash(TEST_PASSWORD_PLAIN, 10);
  return cachedPasswordHash;
}

function randomCrud(): number {
  return faker.number.int({ min: 0, max: 15 });
}

function randomEventVisibility(): EventVisibility {
  return faker.helpers.arrayElement(EVENT_VISIBILITY_VALUES);
}

function randomAction(): string {
  return faker.helpers.arrayElement([...MANAGEMENT_EVENT_ACTIONS]);
}

/** Seed management_event rows: one or more per management user, with plausible actions/targets. */
async function seedManagementEvents(
  eventRepo: ReturnType<typeof managementDataSource.getRepository<ManagementEvent>>,
  managementUserIds: { id: string; isSuperAdmin: boolean }[],
  count: number
): Promise<void> {
  if (managementUserIds.length === 0) return;

  for (let i = 0; i < count; i += 1) {
    const actor = faker.helpers.arrayElement(managementUserIds);
    const actorType: ActorType = actor.isSuperAdmin ? 'super_admin' : 'admin';
    const action = randomAction();
    const hasTarget = faker.datatype.boolean(0.7);
    const targetType = hasTarget ? faker.helpers.arrayElement([...TARGET_TYPES]) : null;
    const targetId =
      hasTarget && managementUserIds.length > 0
        ? faker.helpers.arrayElement(managementUserIds).id
        : null;
    const details = faker.datatype.boolean(0.3) ? faker.lorem.sentence() : null;

    const event = eventRepo.create({
      id: uuidv4(),
      actorId: actor.id,
      actorType,
      action,
      targetType,
      targetId,
      timestamp: faker.date.recent({ days: 30 }),
      details,
    });
    await eventRepo.save(event);
  }
}

/** Create super admin (username superadmin) only if none exists. User + credentials + bio in one transaction. */
async function ensureSuperAdmin(passwordHash: string): Promise<void> {
  const existing = await managementDataSource.getRepository(ManagementUser).findOne({
    where: { isSuperAdmin: true },
    select: ['id'],
  });
  if (existing !== null) {
    process.stdout.write('Super admin already exists; skipping super admin creation.\n');
    return;
  }

  await managementDataSource.transaction(async (manager) => {
    await manager.query('SET CONSTRAINTS ALL DEFERRED');
    const userRepo = manager.getRepository(ManagementUser);
    const credentialsRepo = manager.getRepository(ManagementUserCredentials);
    const bioRepo = manager.getRepository(ManagementUserBio);

    const id = uuidv4();
    const user = userRepo.create({
      id,
      isSuperAdmin: true,
      createdBy: null,
    });
    await userRepo.save(user);

    const credentials = credentialsRepo.create({
      managementUserId: id,
      username: SUPER_ADMIN_USERNAME,
      passwordHash,
    });
    await credentialsRepo.save(credentials);

    const bio = bioRepo.create({
      managementUserId: id,
      displayName: 'Super Admin',
    });
    await bioRepo.save(bio);
  });

  process.stdout.write(`Created super admin (username ${SUPER_ADMIN_USERNAME}).\n`);
}

export async function seedManagement(rows: number): Promise<void> {
  if (!managementDataSource.isInitialized) {
    await managementDataSource.initialize();
  }

  const userRepo = managementDataSource.getRepository(ManagementUser);
  const eventRepo = managementDataSource.getRepository(ManagementEvent);
  const passwordHash = await getPasswordHash();

  await ensureSuperAdmin(passwordHash);

  for (let i = 0; i < rows; i += 1) {
    await managementDataSource.transaction(async (manager) => {
      await manager.query('SET CONSTRAINTS ALL DEFERRED');
      const uRepo = manager.getRepository(ManagementUser);
      const cRepo = manager.getRepository(ManagementUserCredentials);
      const bRepo = manager.getRepository(ManagementUserBio);
      const pRepo = manager.getRepository(AdminPermissions);

      const id = uuidv4();
      const user = uRepo.create({
        id,
        isSuperAdmin: false,
        createdBy: null,
      });
      await uRepo.save(user);

      const username = `admin-${faker.string.alphanumeric(8)}-${i}`;
      const credentials = cRepo.create({
        managementUserId: id,
        username,
        passwordHash,
      });
      await cRepo.save(credentials);

      const displayName = `Admin ${i + 1}`;
      const bio = bRepo.create({
        managementUserId: id,
        displayName,
      });
      await bRepo.save(bio);

      const permissions = pRepo.create({
        adminId: id,
        adminsCrud: randomCrud(),
        usersCrud: randomCrud(),
        eventVisibility: randomEventVisibility(),
      });
      await pRepo.save(permissions);
    });
  }

  const managementUserIds = await userRepo.find({
    select: ['id', 'isSuperAdmin'],
  });
  const eventCount = Math.min(rows * 3, Math.max(rows + 10, 20));
  await seedManagementEvents(eventRepo, managementUserIds, eventCount);

  process.stdout.write(
    `Seeded management DB: ${rows} management user(s), ${eventCount} management event(s).\n`
  );
}
