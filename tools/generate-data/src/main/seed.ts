import type { SeedRuntimeOptions } from '../types.js';
import type { BucketType } from '@metaboost/orm';

/**
 * Seeds the main DB with broad, high-variation permutations for local UI/QA validation.
 * Call only after loading apps/api .env so appDataSource has DB_*.
 */
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

import {
  INVITATION_TOKEN_LENGTH,
  MAX_MESSAGE_BODY_MAX_LENGTH,
  MIN_MESSAGE_BODY_MAX_LENGTH,
  SHORT_TEXT_MAX_LENGTH,
} from '@metaboost/helpers';
import {
  appDataSource,
  Bucket,
  BucketAdmin,
  BucketAdminInvitation,
  BucketMessage,
  BucketMessageAppMeta,
  BucketMessageValue,
  BucketRole,
  BucketRSSChannelInfo,
  BucketRSSItemInfo,
  BucketSettings,
  User,
  UserBio,
  UserCredentials,
} from '@metaboost/orm';

import {
  assertCrudMask,
  assertPositiveInteger,
  assertString,
  makeNamespacedValue,
  randomCrudMask,
  randomIdText,
} from '../contracts.js';
import { resolveMainProfileCardinality } from '../types.js';
import {
  cleanupMainDataSource,
  initializeMainDataSource,
  truncateMainData,
} from './data-source.js';

const TEST_PASSWORD_PLAIN = 'Test!1Aa';

let cachedPasswordHash: string | null = null;

async function getPasswordHash(): Promise<string> {
  if (cachedPasswordHash !== null) return cachedPasswordHash;
  cachedPasswordHash = await bcrypt.hash(TEST_PASSWORD_PLAIN, 10);
  return cachedPasswordHash;
}

function truncateShortText(value: string): string {
  if (value.length <= SHORT_TEXT_MAX_LENGTH) {
    return value;
  }
  return value.slice(0, SHORT_TEXT_MAX_LENGTH);
}

function truncateToken(value: string): string {
  return value.length > INVITATION_TOKEN_LENGTH ? value.slice(0, INVITATION_TOKEN_LENGTH) : value;
}

function createUserHandle(namespace: string, index: number): string {
  return makeNamespacedValue(namespace, `u${index}`);
}

function chooseBucketMessageLength(baseIndex: number): number {
  const values = [MIN_MESSAGE_BODY_MAX_LENGTH, 500, 800, 1200, MAX_MESSAGE_BODY_MAX_LENGTH];
  return values[baseIndex % values.length] ?? 500;
}

/** Caps seeded BTC boosts so demo data stays realistic (≤ ~0.001 BTC per message). */
const MAX_SEED_BTC_MAIN_UNIT = 0.001;
const MAX_SEED_SATOSHIS = Math.floor(MAX_SEED_BTC_MAIN_UNIT * 100_000_000);

function generateSeedMessageAmount({
  currency,
  amountUnit,
}: {
  currency: string;
  amountUnit: string | null;
}): string {
  if (currency !== 'BTC') {
    return faker.number.float({ min: 1, max: 1000, fractionDigits: 2 }).toFixed(2);
  }
  const unit = amountUnit?.trim().toLowerCase() ?? '';
  if (unit === 'satoshis') {
    return String(faker.number.int({ min: 1, max: MAX_SEED_SATOSHIS }));
  }
  return faker.number
    .float({ min: 1e-8, max: MAX_SEED_BTC_MAIN_UNIT, fractionDigits: 8 })
    .toFixed(8);
}

function chooseBucketType(rootKind: 'network' | 'channel', depth: number): BucketType {
  if (depth === 0) {
    return rootKind === 'network' ? 'rss-network' : 'rss-channel';
  }
  if (depth === 1) {
    return 'rss-channel';
  }
  return 'rss-item';
}

async function createBucketWithSettings(
  ownerId: string,
  parentBucketId: string | null,
  name: string,
  type: BucketType,
  isPublic: boolean,
  messageBodyMaxLength: number
): Promise<Bucket> {
  const bucketRepo = appDataSource.getRepository(Bucket);
  const settingsRepo = appDataSource.getRepository(BucketSettings);
  const bucket = bucketRepo.create({
    ownerId,
    parentBucketId,
    name: truncateShortText(name),
    type,
    isPublic,
    idText: randomIdText(),
  });
  await bucketRepo.save(bucket);
  const settings = settingsRepo.create({
    bucketId: bucket.id,
    messageBodyMaxLength,
  });
  await settingsRepo.save(settings);
  return bucket;
}

async function seedMessagesForBucket(
  bucket: Bucket,
  namespace: string,
  messagesPerBucket: number,
  messageOffset: number
): Promise<number> {
  const messageRepo = appDataSource.getRepository(BucketMessage);
  const appMetaRepo = appDataSource.getRepository(BucketMessageAppMeta);
  const valueRepo = appDataSource.getRepository(BucketMessageValue);

  const messageDateTo = new Date();
  const messageDateFrom = new Date(messageDateTo);
  messageDateFrom.setUTCFullYear(messageDateFrom.getUTCFullYear() - 2);

  let created = 0;

  for (let i = 0; i < messagesPerBucket; i += 1) {
    const sequence = messageOffset + i;
    const action = sequence % 2 === 0 ? 'boost' : 'stream';
    // Always ISO codes (BTC/USD); display normalizes legacy values like "Bitcoin" -> BTC.
    const currency = sequence % 3 === 1 ? 'USD' : 'BTC';
    const amountUnit = sequence % 3 === 0 ? 'satoshis' : sequence % 3 === 1 ? 'cents' : null;
    const amount = generateSeedMessageAmount({ currency, amountUnit });
    const body =
      action === 'stream'
        ? null
        : `GD:${namespace}:message:${bucket.id}:${sequence} ${faker.lorem.sentence({ min: 5, max: 14 })}`;
    const senderName = sequence % 4 === 0 ? null : truncateShortText(faker.person.fullName());
    const message = messageRepo.create({
      bucketId: bucket.id,
      messageGuid: randomUUID(),
      senderName,
      body,
      action,
      createdAt: faker.date.between({ from: messageDateFrom, to: messageDateTo }),
    });
    await messageRepo.save(message);

    const value = valueRepo.create({
      bucketMessageId: message.id,
      currency,
      amount,
      amountUnit,
    });
    await valueRepo.save(value);

    if (sequence % 3 !== 0) {
      const appMeta = appMetaRepo.create({
        bucketMessageId: message.id,
        appName: truncateShortText(`gd-app-${namespace}`),
        appVersion: sequence % 5 === 0 ? null : `1.${sequence % 10}.${(sequence + 3) % 10}`,
        senderGuid: sequence % 2 === 0 ? `sender-${namespace}-${sequence}` : null,
        podcastIndexFeedId: sequence % 4 === 0 ? null : 100_000 + sequence,
        timePosition:
          sequence % 4 === 0 ? null : faker.number.float({ min: 0, max: 8_000 }).toFixed(2),
      });
      await appMetaRepo.save(appMeta);
    }

    created += 1;
  }

  return created;
}

async function validateMainSeed(namespace: string): Promise<void> {
  const credentialRepo = appDataSource.getRepository(UserCredentials);
  const bucketRepo = appDataSource.getRepository(Bucket);

  const taggedUsers = await credentialRepo
    .createQueryBuilder('credentials')
    .where('credentials.email LIKE :prefix', { prefix: `${namespace}-%@example.com` })
    .orWhere('credentials.username LIKE :prefix', { prefix: `${namespace}-%` })
    .getCount();
  if (taggedUsers < 1) {
    throw new Error(`Validation failed: no users seeded for namespace "${namespace}".`);
  }

  const typeRows = await bucketRepo
    .createQueryBuilder('bucket')
    .select('bucket.type', 'type')
    .addSelect('COUNT(*)', 'count')
    .where('bucket.name LIKE :prefix', { prefix: `${namespace}-%` })
    .groupBy('bucket.type')
    .getRawMany<{ type: string; count: string }>();
  const typeMap = new Map<string, number>();
  for (const row of typeRows) {
    typeMap.set(row.type, Number.parseInt(row.count, 10));
  }
  for (const requiredType of [
    'rss-network',
    'rss-channel',
    'rss-item',
    'mb-root',
    'mb-mid',
    'mb-leaf',
  ]) {
    if ((typeMap.get(requiredType) ?? 0) < 1) {
      throw new Error(
        `Validation failed: bucket type "${requiredType}" missing for namespace "${namespace}".`
      );
    }
  }

  const invitationStatuses = await appDataSource
    .getRepository(BucketAdminInvitation)
    .createQueryBuilder('invitation')
    .select('invitation.status', 'status')
    .addSelect('COUNT(*)', 'count')
    .where('invitation.token LIKE :prefix', { prefix: `${namespace}-%` })
    .groupBy('invitation.status')
    .getRawMany<{ status: string; count: string }>();
  const statusMap = new Map<string, number>();
  for (const row of invitationStatuses) {
    statusMap.set(row.status, Number.parseInt(row.count, 10));
  }
  for (const status of ['pending', 'accepted', 'rejected']) {
    if ((statusMap.get(status) ?? 0) < 1) {
      throw new Error(
        `Validation failed: invitation status "${status}" missing for namespace "${namespace}".`
      );
    }
  }
}

export async function seedMain(options: SeedRuntimeOptions): Promise<void> {
  assertPositiveInteger('rows', options.rows);
  assertString('namespace', options.namespace);
  await initializeMainDataSource(options.allowTestDb);

  faker.seed(options.seed);

  if (options.mode === 'truncate') {
    await truncateMainData();
  }

  const profile = resolveMainProfileCardinality(options);
  const passwordHash = await getPasswordHash();
  const userRepo = appDataSource.getRepository(User);
  const credentialsRepo = appDataSource.getRepository(UserCredentials);
  const bioRepo = appDataSource.getRepository(UserBio);
  const channelInfoRepo = appDataSource.getRepository(BucketRSSChannelInfo);
  const itemInfoRepo = appDataSource.getRepository(BucketRSSItemInfo);
  const bucketAdminRepo = appDataSource.getRepository(BucketAdmin);
  const bucketRoleRepo = appDataSource.getRepository(BucketRole);
  const invitationRepo = appDataSource.getRepository(BucketAdminInvitation);

  const users: User[] = [];

  for (let i = 0; i < profile.users; i += 1) {
    const user = userRepo.create({
      idText: randomIdText(),
      emailVerifiedAt: i % 3 === 0 ? faker.date.recent({ days: 180 }) : null,
    });
    await userRepo.save(user);
    users.push(user);

    const handle = createUserHandle(options.namespace, i);
    const credentials = credentialsRepo.create({
      userId: user.id,
      email: `${handle}@example.com`,
      username: i % 4 === 0 ? handle : null,
      passwordHash,
    });
    await credentialsRepo.save(credentials);

    const bio = bioRepo.create({
      userId: user.id,
      displayName:
        i % 5 === 0
          ? null
          : truncateShortText(makeNamespacedValue(options.namespace, faker.person.fullName())),
    });
    await bioRepo.save(bio);
  }

  const allBuckets: Bucket[] = [];
  const rootBuckets: Bucket[] = [];
  const channelBuckets: Bucket[] = [];
  const itemBuckets: Bucket[] = [];

  for (let userIndex = 0; userIndex < users.length; userIndex += 1) {
    const owner = users[userIndex];
    if (owner === undefined) {
      continue;
    }

    for (let networkIndex = 0; networkIndex < profile.topLevelNetworksPerUser; networkIndex += 1) {
      const rootNetwork = await createBucketWithSettings(
        owner.id,
        null,
        makeNamespacedValue(options.namespace, `network-${userIndex}-${networkIndex}`),
        chooseBucketType('network', 0),
        networkIndex % 2 === 0,
        chooseBucketMessageLength(networkIndex)
      );
      allBuckets.push(rootNetwork);
      rootBuckets.push(rootNetwork);

      for (
        let nestedChannelIndex = 0;
        nestedChannelIndex < profile.nestedChannelsPerNetwork;
        nestedChannelIndex += 1
      ) {
        const channel = await createBucketWithSettings(
          owner.id,
          rootNetwork.id,
          makeNamespacedValue(
            options.namespace,
            `network-channel-${userIndex}-${networkIndex}-${nestedChannelIndex}`
          ),
          chooseBucketType('network', 1),
          nestedChannelIndex % 2 === 0,
          chooseBucketMessageLength(nestedChannelIndex + 1)
        );
        allBuckets.push(channel);
        channelBuckets.push(channel);

        const channelInfo = channelInfoRepo.create({
          bucketId: channel.id,
          rssFeedUrl: `https://feeds.example.com/${options.namespace}/network/${userIndex}/${nestedChannelIndex}`,
          rssPodcastGuid: `podcast-guid-${options.namespace}-network-${userIndex}-${networkIndex}-${nestedChannelIndex}`,
          rssChannelTitle: makeNamespacedValue(
            options.namespace,
            `Network Channel ${userIndex}-${networkIndex}-${nestedChannelIndex}`
          ),
          rssLastParseAttempt:
            nestedChannelIndex % 2 === 0 ? faker.date.recent({ days: 45 }) : null,
          rssLastSuccessfulParse:
            nestedChannelIndex % 3 === 0 ? faker.date.recent({ days: 40 }) : null,
          rssVerified: nestedChannelIndex % 4 === 0 ? faker.date.recent({ days: 200 }) : null,
          rssVerificationFailedAt: null,
          rssLastParsedFeedHash:
            nestedChannelIndex % 3 === 0 ? faker.string.alphanumeric({ length: 32 }) : null,
        });
        await channelInfoRepo.save(channelInfo);

        for (let itemIndex = 0; itemIndex < profile.nestedItemsPerChannel; itemIndex += 1) {
          const item = await createBucketWithSettings(
            owner.id,
            channel.id,
            makeNamespacedValue(
              options.namespace,
              `network-item-${userIndex}-${networkIndex}-${nestedChannelIndex}-${itemIndex}`
            ),
            chooseBucketType('network', 2),
            itemIndex % 2 === 0,
            chooseBucketMessageLength(itemIndex + 2)
          );
          allBuckets.push(item);
          itemBuckets.push(item);

          const itemInfo = itemInfoRepo.create({
            bucketId: item.id,
            parentRssChannelBucketId: channel.id,
            rssItemGuid: `https://items.example.com/${options.namespace}/${userIndex}/${networkIndex}/${nestedChannelIndex}/${itemIndex}`,
            rssItemPubDate: faker.date.between({
              from: '2020-01-01T00:00:00.000Z',
              to: '2026-04-14T00:00:00.000Z',
            }),
            orphaned: itemIndex % 5 === 0,
          });
          await itemInfoRepo.save(itemInfo);
        }
      }
    }

    for (let channelIndex = 0; channelIndex < profile.topLevelChannelsPerUser; channelIndex += 1) {
      const topLevelChannel = await createBucketWithSettings(
        owner.id,
        null,
        makeNamespacedValue(options.namespace, `channel-${userIndex}-${channelIndex}`),
        chooseBucketType('channel', 0),
        channelIndex % 2 === 0,
        chooseBucketMessageLength(channelIndex + 3)
      );
      allBuckets.push(topLevelChannel);
      rootBuckets.push(topLevelChannel);
      channelBuckets.push(topLevelChannel);

      const channelInfo = channelInfoRepo.create({
        bucketId: topLevelChannel.id,
        rssFeedUrl: `https://feeds.example.com/${options.namespace}/channel/${userIndex}/${channelIndex}`,
        rssPodcastGuid: `podcast-guid-${options.namespace}-channel-${userIndex}-${channelIndex}`,
        rssChannelTitle: makeNamespacedValue(
          options.namespace,
          `Top Channel ${userIndex}-${channelIndex}`
        ),
        rssLastParseAttempt: channelIndex % 2 === 0 ? faker.date.recent({ days: 20 }) : null,
        rssLastSuccessfulParse: channelIndex % 3 === 0 ? faker.date.recent({ days: 18 }) : null,
        rssVerified: channelIndex % 4 === 0 ? faker.date.recent({ days: 80 }) : null,
        rssVerificationFailedAt: null,
        rssLastParsedFeedHash:
          channelIndex % 2 === 0 ? faker.string.alphanumeric({ length: 32 }) : null,
      });
      await channelInfoRepo.save(channelInfo);

      for (let itemIndex = 0; itemIndex < profile.nestedItemsPerChannel; itemIndex += 1) {
        const item = await createBucketWithSettings(
          owner.id,
          topLevelChannel.id,
          makeNamespacedValue(
            options.namespace,
            `channel-item-${userIndex}-${channelIndex}-${itemIndex}`
          ),
          chooseBucketType('channel', 2),
          itemIndex % 2 === 0,
          chooseBucketMessageLength(itemIndex + 4)
        );
        allBuckets.push(item);
        itemBuckets.push(item);

        const itemInfo = itemInfoRepo.create({
          bucketId: item.id,
          parentRssChannelBucketId: topLevelChannel.id,
          rssItemGuid: `https://items.example.com/${options.namespace}/channel/${userIndex}/${channelIndex}/${itemIndex}`,
          rssItemPubDate: faker.date.between({
            from: '2019-01-01T00:00:00.000Z',
            to: '2026-04-14T00:00:00.000Z',
          }),
          orphaned: itemIndex % 4 === 0,
        });
        await itemInfoRepo.save(itemInfo);
      }
    }

    if (userIndex === 0) {
      const mbRoot = await createBucketWithSettings(
        owner.id,
        null,
        makeNamespacedValue(options.namespace, 'mb-root-0'),
        'mb-root',
        true,
        chooseBucketMessageLength(0)
      );
      allBuckets.push(mbRoot);
      const mbMid = await createBucketWithSettings(
        owner.id,
        mbRoot.id,
        makeNamespacedValue(options.namespace, 'mb-mid-0'),
        'mb-mid',
        true,
        chooseBucketMessageLength(1)
      );
      allBuckets.push(mbMid);
      const mbLeaf = await createBucketWithSettings(
        owner.id,
        mbMid.id,
        makeNamespacedValue(options.namespace, 'mb-leaf-0'),
        'mb-leaf',
        true,
        chooseBucketMessageLength(2)
      );
      allBuckets.push(mbLeaf);
    }
  }

  const candidateAdminUsers = [...users];
  for (let bucketIndex = 0; bucketIndex < rootBuckets.length; bucketIndex += 1) {
    const bucket = rootBuckets[bucketIndex];
    if (bucket === undefined) {
      continue;
    }
    const owner = users.find((user) => user.id === bucket.ownerId);
    if (owner === undefined) {
      continue;
    }

    const adminsToCreate = Math.min(3, candidateAdminUsers.length);
    for (let adminOffset = 0; adminOffset < adminsToCreate; adminOffset += 1) {
      const candidate =
        candidateAdminUsers[(bucketIndex + adminOffset + 1) % candidateAdminUsers.length];
      if (candidate === undefined) {
        continue;
      }
      if (candidate.id === owner.id) {
        continue;
      }
      const bucketCrud = randomCrudMask();
      const bucketMessagesCrud = randomCrudMask();
      const bucketAdminsCrud = randomCrudMask();
      assertCrudMask('bucketCrud', bucketCrud);
      assertCrudMask('bucketMessagesCrud', bucketMessagesCrud);
      assertCrudMask('bucketAdminsCrud', bucketAdminsCrud);
      const admin = bucketAdminRepo.create({
        bucketId: bucket.id,
        userId: candidate.id,
        bucketCrud,
        bucketMessagesCrud,
        bucketAdminsCrud,
      });
      await bucketAdminRepo.save(admin);
    }

    const roleCount = 2;
    for (let roleIndex = 0; roleIndex < roleCount; roleIndex += 1) {
      const role = bucketRoleRepo.create({
        bucketId: bucket.id,
        name: truncateShortText(
          makeNamespacedValue(options.namespace, `role-${bucketIndex}-${roleIndex}`)
        ),
        bucketCrud: randomCrudMask(),
        bucketMessagesCrud: randomCrudMask(),
        bucketAdminsCrud: randomCrudMask(),
      });
      await bucketRoleRepo.save(role);
    }

    for (
      let invitationIndex = 0;
      invitationIndex < profile.invitationsPerRootBucket;
      invitationIndex += 1
    ) {
      // With invitationsPerRootBucket < 3, invitationIndex % 3 per bucket only yields pending and accepted.
      // Combined with bucketIndex so rejected (and full status coverage) appears across root buckets without extra rows.
      const statusMod = (bucketIndex + invitationIndex) % 3;
      const status = statusMod === 0 ? 'pending' : statusMod === 1 ? 'accepted' : 'rejected';
      const expiresAt =
        status === 'pending' ? faker.date.soon({ days: 10 }) : faker.date.recent({ days: 10 });
      const invitation = invitationRepo.create({
        bucketId: bucket.id,
        token: truncateShortText(
          truncateToken(
            makeNamespacedValue(
              options.namespace,
              faker.string.alphanumeric(INVITATION_TOKEN_LENGTH - 8)
            )
          )
        ),
        status,
        bucketCrud: randomCrudMask(),
        bucketMessagesCrud: randomCrudMask(),
        bucketAdminsCrud: randomCrudMask(),
        expiresAt,
      });
      await invitationRepo.save(invitation);
    }
  }

  const messageTargets = [...channelBuckets, ...itemBuckets];
  let messageOffset = 0;
  let messageCount = 0;
  for (const targetBucket of messageTargets) {
    const created = await seedMessagesForBucket(
      targetBucket,
      options.namespace,
      profile.messagesPerBucket,
      messageOffset
    );
    messageOffset += profile.messagesPerBucket;
    messageCount += created;
  }

  if (options.validate) {
    await validateMainSeed(options.namespace);
  }

  process.stdout.write(
    `Seeded main DB (${options.namespace}): users=${users.length}, buckets=${allBuckets.length}, channels=${channelBuckets.length}, items=${itemBuckets.length}, messages=${messageCount}.\n`
  );

  await cleanupMainDataSource();
}
