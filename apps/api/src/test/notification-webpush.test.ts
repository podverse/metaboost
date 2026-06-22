import type { Mock } from 'vitest';

/**
 * API integration tests: bucket notification preferences, Web Push subscriptions, inheritance,
 * apply-to-descendants, dispatch gating (threshold), and web-push send attempts.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { sendNotification } from 'web-push';

import {
  BucketAdminService,
  BucketMessageService,
  BucketNotificationPreferenceService,
  BucketRSSChannelInfoService,
  BucketService,
  UserTermsAcceptanceService,
  UserService,
  UserWebPushSubscriptionService,
} from '@metaboost/orm';

import { config } from '../config/index.js';
import { hashPassword } from '../lib/auth/hash.js';
import { notifyNewBucketMessage } from '../lib/notifications/notifyNewBucketMessage.js';
import { createApiLoginAgent } from './helpers/login-agent.js';
import { createApiTestApp, destroyApiTestDataSources } from './helpers/setup.js';

vi.mock('web-push', () => ({
  setVapidDetails: vi.fn(),
  sendNotification: vi.fn().mockResolvedValue(undefined),
}));

const API = config.apiVersionPath;
const FILE_PREFIX = 'webpush';

async function deleteAllWebPushSubscriptionsForUser(userId: string): Promise<void> {
  const subs = await UserWebPushSubscriptionService.listByUser(userId);
  for (const sub of subs) {
    await UserWebPushSubscriptionService.delete(sub.id, userId);
  }
}

describe('notification web push (API integration)', () => {
  let app: Awaited<ReturnType<typeof createApiTestApp>>;
  const ownerPassword = `${FILE_PREFIX}-pwd`;
  let ownerEmail: string;
  let ownerId: string;

  beforeAll(async () => {
    process.env.WEBPUSH_VAPID_PUBLIC_KEY = 'BP_notification_integration_public_xxxxx';
    process.env.WEBPUSH_VAPID_PRIVATE_KEY = 'notification_integration_private_xxxxx';
    process.env.WEBPUSH_VAPID_SUBJECT = 'mailto:notification-test@example.com';

    app = await createApiTestApp();
    ownerEmail = `${FILE_PREFIX}-owner-${Date.now()}@example.com`;
    const hashed = await hashPassword(ownerPassword);
    const owner = await UserService.create({
      email: ownerEmail,
      password: hashed,
      displayName: 'WebPush Owner',
    });
    ownerId = owner.id;
    await UserTermsAcceptanceService.recordAcceptanceForCurrentVersion(owner.id);
  });

  beforeEach(() => {
    vi.mocked(sendNotification).mockClear();
  });

  afterAll(async () => {
    delete process.env.WEBPUSH_VAPID_PUBLIC_KEY;
    delete process.env.WEBPUSH_VAPID_PRIVATE_KEY;
    delete process.env.WEBPUSH_VAPID_SUBJECT;
    await destroyApiTestDataSources();
  });

  it('GET /buckets/:bucketId/notification-preference returns defaults before explicit preference', async () => {
    const agent = await createApiLoginAgent(app, {
      email: ownerEmail,
      password: ownerPassword,
    });
    const bucket = await BucketService.createMbRoot({
      ownerId,
      name: 'Pref Root',
      isPublic: true,
    });
    const res = await agent
      .get(`${API}/buckets/${bucket.idText}/notification-preference`)
      .expect(200);
    expect(res.body.enabled).toBe(false);
    expect(res.body.hasExplicitPreference).toBe(false);
    expect(res.body.bucketId).toBe(bucket.id);
  });

  it('PATCH notification preference updates state for this bucket only', async () => {
    const agent = await createApiLoginAgent(app, {
      email: ownerEmail,
      password: ownerPassword,
    });
    const bucket = await BucketService.createMbRoot({
      ownerId,
      name: 'Patch Solo Root',
      isPublic: true,
    });
    await agent
      .patch(`${API}/buckets/${bucket.idText}/notification-preference`)
      .send({ enabled: true })
      .expect(200);
    const row = await BucketNotificationPreferenceService.findByUserAndBucket(ownerId, bucket.id);
    expect(row?.enabled).toBe(true);
    const getRes = await agent
      .get(`${API}/buckets/${bucket.idText}/notification-preference`)
      .expect(200);
    expect(getRes.body.enabled).toBe(true);
    expect(getRes.body.hasExplicitPreference).toBe(true);
  });

  it('PATCH with applyToDescendants updates all descendant buckets', async () => {
    const agent = await createApiLoginAgent(app, {
      email: ownerEmail,
      password: ownerPassword,
    });
    const root = await BucketService.createMbRoot({
      ownerId,
      name: 'Desc Root',
      isPublic: true,
    });
    const mid = await BucketService.createMbMid({
      ownerId,
      parentBucketId: root.id,
      name: 'Desc Mid',
      isPublic: true,
    });
    await BucketNotificationPreferenceService.upsert(ownerId, mid.id, false);
    await agent
      .patch(`${API}/buckets/${root.idText}/notification-preference`)
      .send({ enabled: true, applyToDescendants: true })
      .expect(200);
    const midPref = await BucketNotificationPreferenceService.findByUserAndBucket(ownerId, mid.id);
    expect(midPref?.enabled).toBe(true);
    const rootPref = await BucketNotificationPreferenceService.findByUserAndBucket(
      ownerId,
      root.id
    );
    expect(rootPref?.enabled).toBe(true);
  });

  it('PATCH applyToDescendants bulk-upserts at least five descendants in one service call', async () => {
    /* Vitest spy typing; ORM method exists at runtime after packages build. */
    const bulkSpy = vi.spyOn(
      BucketNotificationPreferenceService,
      'upsertManyForUser' as never
    ) as unknown as Mock;
    const agent = await createApiLoginAgent(app, {
      email: ownerEmail,
      password: ownerPassword,
    });
    const root = await BucketService.createMbRoot({
      ownerId,
      name: 'Bulk Desc Root',
      isPublic: true,
    });
    const descendantIds: string[] = [];
    for (let i = 0; i < 5; i++) {
      const child = await BucketService.createMbMid({
        ownerId,
        parentBucketId: root.id,
        name: `Bulk Desc Mid ${i}`,
        isPublic: true,
      });
      descendantIds.push(child.id);
      await BucketNotificationPreferenceService.upsert(ownerId, child.id, false);
    }
    await agent
      .patch(`${API}/buckets/${root.idText}/notification-preference`)
      .send({ enabled: true, applyToDescendants: true })
      .expect(200);
    expect(bulkSpy).toHaveBeenCalledTimes(1);
    const bulkCall = bulkSpy.mock.calls[0];
    expect(bulkCall?.[0]).toBe(ownerId);
    const bulkBucketIds = bulkCall?.[1];
    expect(Array.isArray(bulkBucketIds)).toBe(true);
    if (!Array.isArray(bulkBucketIds)) {
      throw new Error('expected upsertManyForUser second argument to be bucket id array');
    }
    expect(bulkBucketIds).toEqual(expect.arrayContaining(descendantIds));
    expect(bulkBucketIds).toHaveLength(descendantIds.length);
    expect(bulkCall?.[2]).toBe(true);
    for (const id of descendantIds) {
      const pref = await BucketNotificationPreferenceService.findByUserAndBucket(ownerId, id);
      expect(pref?.enabled).toBe(true);
    }
    bulkSpy.mockRestore();
  });

  it('PATCH without applyToDescendants leaves descendant preferences unchanged', async () => {
    const agent = await createApiLoginAgent(app, {
      email: ownerEmail,
      password: ownerPassword,
    });
    const root = await BucketService.createMbRoot({
      ownerId,
      name: 'NoApply Root',
      isPublic: true,
    });
    const mid = await BucketService.createMbMid({
      ownerId,
      parentBucketId: root.id,
      name: 'NoApply Mid',
      isPublic: true,
    });
    await BucketNotificationPreferenceService.upsert(ownerId, mid.id, false);
    await agent
      .patch(`${API}/buckets/${root.idText}/notification-preference`)
      .send({ enabled: true, applyToDescendants: false })
      .expect(200);
    const midPref = await BucketNotificationPreferenceService.findByUserAndBucket(ownerId, mid.id);
    expect(midPref?.enabled).toBe(false);
    const rootPref = await BucketNotificationPreferenceService.findByUserAndBucket(
      ownerId,
      root.id
    );
    expect(rootPref?.enabled).toBe(true);
  });

  it('creating mb-mid child copies parent notification preferences', async () => {
    const root = await BucketService.createMbRoot({
      ownerId,
      name: 'Inherit Mb Root',
      isPublic: true,
    });
    await BucketNotificationPreferenceService.upsert(ownerId, root.id, true);
    const mid = await BucketService.createMbMid({
      ownerId,
      parentBucketId: root.id,
      name: 'Inherit Mb Mid',
      isPublic: true,
    });
    const midPref = await BucketNotificationPreferenceService.findByUserAndBucket(ownerId, mid.id);
    expect(midPref?.enabled).toBe(true);
  });

  it('creating rss-item child copies parent notification preferences', async () => {
    const channel = await BucketService.createRssChannel({
      ownerId,
      name: 'Inherit Rss Channel',
      isPublic: true,
    });
    await BucketRSSChannelInfoService.upsert({
      bucketId: channel.id,
      rssPodcastGuid: `rss-guid-${FILE_PREFIX}-${Date.now()}`,
      rssChannelTitle: 'Channel Title',
    });
    await BucketNotificationPreferenceService.upsert(ownerId, channel.id, false);
    const item = await BucketService.createRssItem({
      ownerId,
      parentBucketId: channel.id,
      name: 'Inherit Rss Item',
      isPublic: true,
    });
    const itemPref = await BucketNotificationPreferenceService.findByUserAndBucket(
      ownerId,
      item.id
    );
    expect(itemPref?.enabled).toBe(false);
  });

  it('authenticated web-push-subscriptions CRUD', async () => {
    const agent = await createApiLoginAgent(app, {
      email: ownerEmail,
      password: ownerPassword,
    });
    const endpoint = `https://example.invalid/push/${FILE_PREFIX}-${Date.now()}`;
    const upsertBody = {
      endpoint,
      keys: {
        p256dh: 'BKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        auth: 'xxxxxxxxxxxxxxxxxxxx',
      },
      locale: 'en-US',
    };
    const postRes = await agent
      .post(`${API}/auth/web-push-subscriptions`)
      .send(upsertBody)
      .expect(200);
    const subscriptionUnknown = postRes.body.subscription;
    expect(typeof subscriptionUnknown === 'object' && subscriptionUnknown !== null).toBe(true);
    if (typeof subscriptionUnknown !== 'object' || subscriptionUnknown === null) {
      throw new Error('expected subscription object in POST response');
    }
    const rawSubId = Reflect.get(subscriptionUnknown, 'id');
    expect(typeof rawSubId === 'string' && rawSubId !== '').toBe(true);
    if (typeof rawSubId !== 'string' || rawSubId === '') {
      throw new Error('expected subscription id string');
    }
    const subId = rawSubId;

    const loaded = await UserWebPushSubscriptionService.findByIdForUser(subId, ownerId);
    expect(loaded).not.toBeNull();
    expect(loaded?.id).toBe(subId);
    expect(loaded?.endpoint).toBe(endpoint);

    const listRes = await agent.get(`${API}/auth/web-push-subscriptions`).expect(200);
    const subs = listRes.body.subscriptions as Array<{ id: string; endpoint: string }>;
    expect(subs.some((s) => s.endpoint === endpoint)).toBe(true);

    await agent
      .patch(`${API}/auth/web-push-subscriptions/${subId}`)
      .send({ locale: null })
      .expect(200);

    await agent.delete(`${API}/auth/web-push-subscriptions/${subId}`).expect(204);

    const afterDel = await agent.get(`${API}/auth/web-push-subscriptions`).expect(200);
    const subsAfter = afterDel.body.subscriptions as Array<{ endpoint: string }>;
    expect(subsAfter.some((s) => s.endpoint === endpoint)).toBe(false);
  });

  it('notifyNewBucketMessage loads subscriptions once and sends to every endpoint across users', async () => {
    const listSpy = vi.spyOn(
      UserWebPushSubscriptionService,
      'listByUserIds' as never
    ) as unknown as Mock;
    const bucket = await BucketService.createMbRoot({
      ownerId,
      name: 'Multi-subscriber Root',
      isPublic: true,
    });
    await BucketService.update(bucket.id, { publicBoostDisplayMinimumMinor: 100 });

    const otherEmailAddr = `${FILE_PREFIX}-other-${Date.now()}@example.com`;
    const otherPassword = `${FILE_PREFIX}-other-pwd`;
    const otherHashed = await hashPassword(otherPassword);
    const otherUser = await UserService.create({
      email: otherEmailAddr,
      password: otherHashed,
      displayName: 'WebPush Other',
    });
    await UserTermsAcceptanceService.recordAcceptanceForCurrentVersion(otherUser.id);
    await BucketAdminService.create({
      bucketId: bucket.id,
      userId: otherUser.id,
      bucketCrud: 1,
      bucketMessagesCrud: 0,
      bucketAdminsCrud: 0,
    });

    await BucketNotificationPreferenceService.upsert(ownerId, bucket.id, true);
    await BucketNotificationPreferenceService.upsert(otherUser.id, bucket.id, true);

    const ownerSubCount = 2;
    const otherSubCount = 3;
    for (let i = 0; i < ownerSubCount; i++) {
      await UserWebPushSubscriptionService.upsert({
        userId: ownerId,
        endpoint: `https://example.invalid/push/${FILE_PREFIX}-multi-owner-${Date.now()}-${i}`,
        keyP256dh: 'BKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        keyAuth: 'xxxxxxxxxxxxxxxxxxxx',
        locale: null,
      });
    }
    for (let j = 0; j < otherSubCount; j++) {
      await UserWebPushSubscriptionService.upsert({
        userId: otherUser.id,
        endpoint: `https://example.invalid/push/${FILE_PREFIX}-multi-other-${Date.now()}-${j}`,
        keyP256dh: 'BKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        keyAuth: 'xxxxxxxxxxxxxxxxxxxx',
        locale: null,
      });
    }

    const msg = await BucketMessageService.create({
      bucketId: bucket.id,
      senderName: 'Sender',
      body: 'multi subscriber',
      currency: 'USD',
      amount: 10,
      amountUnit: 'cents',
      thresholdCurrencyAtCreate: 'USD',
      thresholdAmountMinorAtCreate: 150,
      action: 'boost',
      appName: 'App',
      senderGuid: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    });

    await notifyNewBucketMessage({ bucketId: bucket.id, message: msg });

    expect(listSpy).toHaveBeenCalledTimes(1);
    const listCall = listSpy.mock.calls[0];
    const firstArg = listCall?.[0];
    expect(Array.isArray(firstArg)).toBe(true);
    if (!Array.isArray(firstArg)) {
      throw new Error('expected listByUserIds first argument to be an array');
    }
    expect(firstArg).toHaveLength(2);
    expect(firstArg).toEqual(expect.arrayContaining([ownerId, otherUser.id]));
    expect(vi.mocked(sendNotification)).toHaveBeenCalledTimes(ownerSubCount + otherSubCount);
    await deleteAllWebPushSubscriptionsForUser(ownerId);
    await deleteAllWebPushSubscriptionsForUser(otherUser.id);
    listSpy.mockRestore();
  });

  it('notifyNewBucketMessage triggers web-push send when preference enabled and boost meets threshold', async () => {
    await deleteAllWebPushSubscriptionsForUser(ownerId);
    const bucket = await BucketService.createMbRoot({
      ownerId,
      name: 'Dispatch Root',
      isPublic: true,
    });
    await BucketService.update(bucket.id, { publicBoostDisplayMinimumMinor: 100 });
    await BucketNotificationPreferenceService.upsert(ownerId, bucket.id, true);
    const endpoint = `https://example.invalid/push/${FILE_PREFIX}-dispatch-${Date.now()}`;
    await UserWebPushSubscriptionService.upsert({
      userId: ownerId,
      endpoint,
      keyP256dh: 'BKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      keyAuth: 'xxxxxxxxxxxxxxxxxxxx',
      locale: null,
    });

    const msg = await BucketMessageService.create({
      bucketId: bucket.id,
      senderName: 'Sender',
      body: 'hello threshold',
      currency: 'USD',
      amount: 10,
      amountUnit: 'cents',
      thresholdCurrencyAtCreate: 'USD',
      thresholdAmountMinorAtCreate: 150,
      action: 'boost',
      appName: 'App',
      senderGuid: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    });

    await notifyNewBucketMessage({ bucketId: bucket.id, message: msg });

    expect(vi.mocked(sendNotification)).toHaveBeenCalledTimes(1);
  });

  it('notifyNewBucketMessage does not send when boost is below root public minimum threshold', async () => {
    await deleteAllWebPushSubscriptionsForUser(ownerId);
    const bucket = await BucketService.createMbRoot({
      ownerId,
      name: 'Low Threshold Root',
      isPublic: true,
    });
    await BucketService.update(bucket.id, { publicBoostDisplayMinimumMinor: 500 });
    await BucketNotificationPreferenceService.upsert(ownerId, bucket.id, true);
    const endpoint = `https://example.invalid/push/${FILE_PREFIX}-low-${Date.now()}`;
    await UserWebPushSubscriptionService.upsert({
      userId: ownerId,
      endpoint,
      keyP256dh: 'BKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      keyAuth: 'xxxxxxxxxxxxxxxxxxxx',
      locale: null,
    });

    const msg = await BucketMessageService.create({
      bucketId: bucket.id,
      senderName: 'Sender',
      body: 'below floor',
      currency: 'USD',
      amount: 1,
      amountUnit: 'cents',
      thresholdCurrencyAtCreate: 'USD',
      thresholdAmountMinorAtCreate: 50,
      action: 'boost',
      appName: 'App',
      senderGuid: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    });

    await notifyNewBucketMessage({ bucketId: bucket.id, message: msg });

    expect(vi.mocked(sendNotification)).not.toHaveBeenCalled();
  });
});
