import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  appDataSourceReadWrite,
  BucketMessageService,
  BucketService,
  UserService,
} from '@metaboost/orm';

import { config } from '../config/index.js';
import { hashPassword } from '../lib/auth/hash.js';
import { createApiLoginAgent } from './helpers/login-agent.js';
import { createApiTestApp, destroyApiTestDataSources } from './helpers/setup.js';

const API = config.apiVersionPath;
const FILE_PREFIX = 'bucket-summary';

function mockExchangeRates(): void {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input);
    if (url.includes('frankfurter.app')) {
      return new Response(
        JSON.stringify({
          rates: {
            EUR: 2,
            USD: 1,
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }
    if (url.includes('coingecko.com')) {
      return new Response(JSON.stringify({ bitcoin: { usd: 100000 } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    return new Response('not found', { status: 404 });
  });
}

describe('bucket summary endpoints', () => {
  let app: Awaited<ReturnType<typeof createApiTestApp>>;
  let ownerId = '';
  let rootBucketId = '';
  const ownerEmail = `${FILE_PREFIX}-owner-${Date.now()}@example.com`;
  const ownerPassword = `${FILE_PREFIX}-password`;

  beforeAll(async () => {
    app = await createApiTestApp();
    const hashed = await hashPassword(ownerPassword);
    const owner = await UserService.create({
      email: ownerEmail,
      password: hashed,
      displayName: 'Summary Owner',
      preferredCurrency: 'USD',
    });
    ownerId = owner.id;
    const root = await BucketService.createMbRoot({
      ownerId: owner.id,
      name: `${FILE_PREFIX}-root`,
      isPublic: true,
    });
    rootBucketId = root.id;
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    mockExchangeRates();
  });

  afterAll(async () => {
    vi.restoreAllMocks();
    await destroyApiTestDataSources();
  });

  it('returns dashboard summary with ignored unknown currency entries', async () => {
    await BucketMessageService.create({
      bucketId: rootBucketId,
      currency: 'USD',
      amount: 10,
      amountUnit: 'dollars',
      action: 'boost',
      appName: 'test',
    });
    await BucketMessageService.create({
      bucketId: rootBucketId,
      currency: 'EUR',
      amount: 10,
      amountUnit: 'euros',
      action: 'boost',
      appName: 'test',
    });
    await BucketMessageService.create({
      bucketId: rootBucketId,
      currency: 'ZZZ',
      amount: 5,
      amountUnit: 'units',
      action: 'boost',
      appName: 'test',
    });

    const agent = await createApiLoginAgent(app, {
      email: ownerEmail,
      password: ownerPassword,
    });
    const res = await agent
      .get(`${API}/buckets/summary?range=all-time&baselineCurrency=USD`)
      .expect(200);
    expect(typeof res.body.totals.messageCount).toBe('number');
    expect(typeof res.body.totals.convertedAmount).toBe('string');
    expect(typeof res.body.totals.ignoredConversionEntries).toBe('number');
    expect(res.body.baselineCurrency).toBe('USD');
    expect(Array.isArray(res.body.breakdown)).toBe(true);
    expect(Array.isArray(res.body.series)).toBe(true);
  });

  it('returns bucket summary for bucket and descendants', async () => {
    const child = await BucketService.createMbMid({
      ownerId,
      parentBucketId: rootBucketId,
      name: `${FILE_PREFIX}-child-${Date.now()}`,
      isPublic: true,
    });
    await BucketMessageService.create({
      bucketId: rootBucketId,
      currency: 'USD',
      amount: 3,
      amountUnit: 'dollars',
      action: 'boost',
      appName: 'test',
    });
    await BucketMessageService.create({
      bucketId: child.id,
      currency: 'USD',
      amount: 2,
      amountUnit: 'dollars',
      action: 'boost',
      appName: 'test',
    });

    const agent = await createApiLoginAgent(app, {
      email: ownerEmail,
      password: ownerPassword,
    });
    const res = await agent
      .get(`${API}/buckets/${rootBucketId}/summary?range=all-time&baselineCurrency=USD`)
      .expect(200);
    expect(typeof res.body.totals.convertedAmount).toBe('string');
    expect(typeof res.body.totals.messageCount).toBe('number');
    expect(Array.isArray(res.body.breakdown)).toBe(true);
    expect(Array.isArray(res.body.series)).toBe(true);
  });

  it('keeps list and summary counts aligned for timezone-offset timestamps', async () => {
    const created = await BucketMessageService.create({
      bucketId: rootBucketId,
      currency: 'USD',
      amount: 100,
      amountUnit: 'cents',
      action: 'boost',
      appName: 'test',
    });
    await appDataSourceReadWrite.query(
      `UPDATE bucket_message SET created_at = $1::timestamptz WHERE id = $2`,
      ['2030-01-01T00:30:00-05:00', created.id]
    );

    const agent = await createApiLoginAgent(app, {
      email: ownerEmail,
      password: ownerPassword,
    });
    const messagesRes = await agent.get(`${API}/buckets/${rootBucketId}/messages`).expect(200);
    expect(messagesRes.body.total).toBeGreaterThan(0);

    const summaryRes = await agent
      .get(
        `${API}/buckets/${rootBucketId}/summary?range=custom&from=2030-01-01T05:00:00.000Z&to=2030-01-01T06:00:00.000Z&baselineCurrency=USD`
      )
      .expect(200);
    expect(summaryRes.body.totals.messageCount).toBe(1);
    expect(summaryRes.body.totals.convertedAmount).toBe('1');
  });
});
