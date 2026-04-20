/**
 * API integration tests: blocked senders moderation (exclude by sender_guid from lists).
 */
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { BucketMessageService, BucketService, UserService } from '@metaboost/orm';

import { config } from '../config/index.js';
import { hashPassword } from '../lib/auth/hash.js';
import { createApiLoginAgent } from './helpers/login-agent.js';
import { createApiTestApp, destroyApiTestDataSources } from './helpers/setup.js';

const API = config.apiVersionPath;
const FILE_PREFIX = 'bucket-blocked-senders';

const SENDER_GUID_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const SENDER_GUID_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

describe('bucket blocked senders', () => {
  let app: Awaited<ReturnType<typeof createApiTestApp>>;
  let rootBucketId = '';
  const ownerEmail = `${FILE_PREFIX}-owner-${Date.now()}@example.com`;
  const ownerPassword = `${FILE_PREFIX}-password`;

  beforeAll(async () => {
    app = await createApiTestApp();
    const hashed = await hashPassword(ownerPassword);
    const owner = await UserService.create({
      email: ownerEmail,
      password: hashed,
      displayName: 'Blocked Sender Owner',
    });
    const root = await BucketService.createMbRoot({
      ownerId: owner.id,
      name: `${FILE_PREFIX}-root`,
      isPublic: true,
    });
    rootBucketId = root.id;
  });

  afterAll(async () => {
    await destroyApiTestDataSources();
  });

  it('excludes blocked sender from message list until removed', async () => {
    await BucketMessageService.create({
      bucketId: rootBucketId,
      currency: 'USD',
      amount: 1,
      amountUnit: 'dollars',
      action: 'boost',
      appName: 'test',
      senderGuid: SENDER_GUID_A,
      senderName: 'Alice',
    });
    await BucketMessageService.create({
      bucketId: rootBucketId,
      currency: 'USD',
      amount: 2,
      amountUnit: 'dollars',
      action: 'boost',
      appName: 'test',
      senderGuid: SENDER_GUID_B,
      senderName: 'Bob',
    });

    const agent = await createApiLoginAgent(app, {
      email: ownerEmail,
      password: ownerPassword,
    });

    const beforeBlock = await agent.get(`${API}/buckets/${rootBucketId}/messages`).expect(200);
    expect(beforeBlock.body.total).toBe(2);

    const postRes = await agent
      .post(`${API}/buckets/${rootBucketId}/blocked-senders`)
      .send({ senderGuid: SENDER_GUID_A, labelSnapshot: 'Alice' })
      .expect(201);
    expect(postRes.body.blockedSender.senderGuid).toBe(SENDER_GUID_A);

    const whileBlocked = await agent.get(`${API}/buckets/${rootBucketId}/messages`).expect(200);
    expect(whileBlocked.body.total).toBe(1);
    expect(
      whileBlocked.body.messages.every(
        (m: { senderGuid?: string | null }) => m.senderGuid !== SENDER_GUID_A
      )
    ).toBe(true);

    const listBlocked = await agent
      .get(`${API}/buckets/${rootBucketId}/blocked-senders`)
      .expect(200);
    expect(Array.isArray(listBlocked.body.blockedSenders)).toBe(true);
    expect(listBlocked.body.blockedSenders).toHaveLength(1);
    const rowId = listBlocked.body.blockedSenders[0].id as string;
    expect(typeof rowId).toBe('string');
    expect(rowId.length).toBeGreaterThan(0);

    await agent.delete(`${API}/buckets/${rootBucketId}/blocked-senders/${rowId}`).expect(204);

    const afterUnblock = await agent.get(`${API}/buckets/${rootBucketId}/messages`).expect(200);
    expect(afterUnblock.body.total).toBe(2);
  });

  it('returns 401 without auth for blocked-senders routes', async () => {
    await request(app).get(`${API}/buckets/${rootBucketId}/blocked-senders`).expect(401);
  });
});
