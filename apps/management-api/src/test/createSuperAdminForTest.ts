/**
 * Test-only helper: create a super admin in the management DB for integration tests.
 * Not used by the app; bootstrap/setup for deployment belongs in root scripts/
 * (e.g. scripts/management-api/create-super-admin.mjs) and must not ship in Docker.
 */
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

import {
  managementDataSource,
  ManagementUser,
  ManagementUserCredentials,
  ManagementUserBio,
  ManagementUserService,
} from '@metaboost/management-orm';

const SALT_ROUNDS = 10;

export async function createSuperAdminForTest(username: string, password: string): Promise<void> {
  const existing = await ManagementUserService.findSuperAdmin();
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  if (existing !== null) {
    await managementDataSource.transaction(async (manager) => {
      const credRepo = manager.getRepository(ManagementUserCredentials);
      const bioRepo = manager.getRepository(ManagementUserBio);

      const existingCred = await credRepo.findOne({
        where: { managementUserId: existing.id },
      });
      if (existingCred !== null) {
        existingCred.username = username;
        existingCred.passwordHash = passwordHash;
        await credRepo.save(existingCred);
      } else {
        const cred = credRepo.create({
          managementUserId: existing.id,
          username,
          passwordHash,
        });
        await credRepo.save(cred);
      }

      const existingBio = await bioRepo.findOne({
        where: { managementUserId: existing.id },
      });
      if (existingBio === null) {
        const bio = bioRepo.create({
          managementUserId: existing.id,
          displayName: 'Super Admin',
        });
        await bioRepo.save(bio);
      }
    });
    return;
  }
  const id = uuidv4();

  try {
    await managementDataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(ManagementUser);
      const credRepo = manager.getRepository(ManagementUserCredentials);
      const bioRepo = manager.getRepository(ManagementUserBio);

      const user = userRepo.create({
        id,
        isSuperAdmin: true,
        createdBy: null,
      });
      await userRepo.save(user);
      const cred = credRepo.create({
        managementUserId: id,
        username,
        passwordHash,
      });
      await credRepo.save(cred);
      const bio = bioRepo.create({
        managementUserId: id,
        displayName: 'Super Admin',
      });
      await bioRepo.save(bio);
    });
  } catch {
    // Another parallel test process may have created the super admin between our check and
    // insert — tolerate the duplicate key violation from idx_one_super_admin.
    const recheck = await ManagementUserService.findSuperAdmin();
    if (recheck !== null) return;
    throw new Error('createSuperAdminForTest: unexpected error creating super admin');
  }
}
