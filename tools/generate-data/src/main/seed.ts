/**
 * Seeds the main DB with users, user_credentials, user_bio, and buckets (with sub-buckets).
 * Call only after loading apps/api .env so appDataSource has DB_*.
 * For columns with multiple eligible values (e.g. boolean, nullable), a value is chosen randomly per row.
 * Per user: 5 top-level buckets; per bucket: 50 sub-buckets.
 */
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';

import { SHORT_TEXT_MAX_LENGTH } from '@metaboost/helpers';
import { appDataSource, Bucket, User, UserBio, UserCredentials } from '@metaboost/orm';

const BUCKETS_PER_USER = 5;
const SUB_BUCKETS_PER_BUCKET = 50;

function truncateName(name: string): string {
  if (name.length <= SHORT_TEXT_MAX_LENGTH) return name;
  return name.slice(0, SHORT_TEXT_MAX_LENGTH);
}

const TEST_PASSWORD_PLAIN = 'Test!1Aa';

let cachedPasswordHash: string | null = null;

async function getPasswordHash(): Promise<string> {
  if (cachedPasswordHash !== null) return cachedPasswordHash;
  cachedPasswordHash = await bcrypt.hash(TEST_PASSWORD_PLAIN, 10);
  return cachedPasswordHash;
}

function truncateDisplayName(name: string): string {
  if (name.length <= SHORT_TEXT_MAX_LENGTH) return name;
  return name.slice(0, SHORT_TEXT_MAX_LENGTH);
}

export async function seedMain(rows: number): Promise<void> {
  if (!appDataSource.isInitialized) {
    await appDataSource.initialize();
  }

  const passwordHash = await getPasswordHash();

  let bucketCount = 0;

  for (let i = 0; i < rows; i += 1) {
    await appDataSource.transaction(async (manager) => {
      // Force deferred check so user + credentials are visible when constraint runs at commit.
      await manager.query('SET CONSTRAINTS ALL DEFERRED');
      const uRepo = manager.getRepository(User);
      const cRepo = manager.getRepository(UserCredentials);
      const bRepo = manager.getRepository(UserBio);
      const bucketRepo = manager.getRepository(Bucket);

      const user = uRepo.create({
        emailVerifiedAt: faker.datatype.boolean(0.3) ? faker.date.past() : null,
      });
      await uRepo.save(user);

      const email =
        i === 0
          ? faker.internet.email()
          : `${faker.string.alphanumeric(8)}-${i}-${faker.internet.email()}`;
      const credentials = cRepo.create({
        userId: user.id,
        email,
        passwordHash,
      });
      await cRepo.save(credentials);

      const displayName = faker.datatype.boolean(0.8)
        ? truncateDisplayName(faker.person.fullName())
        : null;
      const bio = bRepo.create({
        userId: user.id,
        displayName,
      });
      await bRepo.save(bio);

      for (let j = 0; j < BUCKETS_PER_USER; j += 1) {
        const parent = bucketRepo.create({
          ownerId: user.id,
          name: truncateName(faker.commerce.department()),
          isPublic: faker.datatype.boolean(),
          parentBucketId: null,
        });
        await bucketRepo.save(parent);
        bucketCount += 1;

        for (let k = 0; k < SUB_BUCKETS_PER_BUCKET; k += 1) {
          const sub = bucketRepo.create({
            ownerId: user.id,
            name: truncateName(faker.commerce.productName()),
            isPublic: faker.datatype.boolean(),
            parentBucketId: parent.id,
          });
          await bucketRepo.save(sub);
          bucketCount += 1;
        }
      }
    });
  }

  const topLevel = rows * BUCKETS_PER_USER;
  const subBuckets = topLevel * SUB_BUCKETS_PER_BUCKET;
  process.stdout.write(
    `Seeded main DB: ${rows} user(s), ${topLevel} bucket(s), ${subBuckets} sub-bucket(s) (${bucketCount} total buckets).\n`
  );
}
