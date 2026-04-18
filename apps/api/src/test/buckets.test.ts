/**
 * API integration tests: buckets CRUD endpoints.
 * Covers list, get, create, update, delete and auth/validation errors.
 */
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  BucketMessageService,
  BucketRSSItemInfoService,
  BucketService,
  UserService,
} from '@metaboost/orm';

import { config } from '../config/index.js';
import { hashPassword } from '../lib/auth/hash.js';
import { createApiLoginAgent } from './helpers/login-agent.js';
import { createApiTestApp, destroyApiTestDataSources } from './helpers/setup.js';

const API = config.apiVersionPath;
/** Origin for mock RSS metaBoost URLs; must match `API_PUBLIC_BASE_URL` in test env (full URL equality). */
const TEST_META_BOOST_ORIGIN = 'https://example.invalid';
/** Unique per file to avoid collisions when tests run in parallel. */
const FILE_PREFIX = 'buckets';
const SAMPLE_RSS_XML = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:podcast="https://podcastindex.org/namespace/1.0">
  <channel>
    <title>Sample RSS Channel</title>
    <podcast:guid>feed-guid-${FILE_PREFIX}</podcast:guid>
    <podcast:metaBoost standard="mbrss-v1">https://example.com/standard/mbrss-v1/boost/channel</podcast:metaBoost>
    <item>
      <title>Episode One</title>
      <guid>episode-guid-001</guid>
      <pubDate>Mon, 11 Apr 2026 10:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

function buildRssXml(input: {
  podcastGuid: string;
  metaBoostUrl?: string;
  items: Array<{ title: string; guid: string; pubDate: string }>;
}): string {
  const metaBoostTag =
    input.metaBoostUrl === undefined
      ? ''
      : `<podcast:metaBoost standard="mbrss-v1">${input.metaBoostUrl}</podcast:metaBoost>`;
  const itemTags = input.items
    .map(
      (item) =>
        `<item><title>${item.title}</title><guid>${item.guid}</guid><pubDate>${item.pubDate}</pubDate></item>`
    )
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:podcast="https://podcastindex.org/namespace/1.0">
  <channel>
    <title>Verify Channel ${input.podcastGuid}</title>
    <podcast:guid>${input.podcastGuid}</podcast:guid>
    ${metaBoostTag}
    ${itemTags}
  </channel>
</rss>`;
}

function buildEntityHeavyRssXml(podcastGuid: string): string {
  const heavyEntities = Array.from({ length: 1200 }, () => '&#127876;').join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:podcast="https://podcastindex.org/namespace/1.0">
  <channel>
    <title>Entity Heavy RSS Channel</title>
    <podcast:guid>${podcastGuid}</podcast:guid>
    <description>${heavyEntities}</description>
  </channel>
</rss>`;
}

function mockFeedFetchOnce(xml: string, ok = true): void {
  vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async () => {
    return new Response(xml, {
      status: ok ? 200 : 500,
      headers: { 'content-type': 'application/rss+xml' },
    });
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getRequiredStringField(value: unknown, fieldName: string): string {
  if (!isRecord(value) || !(fieldName in value)) {
    throw new Error(`Expected field "${fieldName}" in response body`);
  }
  const fieldValue = value[fieldName];
  if (typeof fieldValue !== 'string' || fieldValue === '') {
    throw new Error(`Expected non-empty string field "${fieldName}" in response body`);
  }
  return fieldValue;
}

describe('buckets', () => {
  let app: Awaited<ReturnType<typeof createApiTestApp>>;
  const ownerEmail = `${FILE_PREFIX}-owner-${Date.now()}@example.com`;
  const ownerPassword = `${FILE_PREFIX}-password-1`;
  let bucketShortId: string;

  beforeAll(async () => {
    app = await createApiTestApp();
    const hashed = await hashPassword(ownerPassword);
    const owner = await UserService.create({
      email: ownerEmail,
      password: hashed,
      displayName: 'Bucket Owner',
    });
    const bucket = await BucketService.create({
      ownerId: owner.id,
      name: 'Existing Bucket',
    });
    bucketShortId = bucket.shortId;
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    vi.restoreAllMocks();
    await destroyApiTestDataSources();
  });

  describe('GET /buckets', () => {
    it('returns 401 when unauthenticated', async () => {
      await request(app).get(`${API}/buckets`).expect(401);
    });

    it('returns 200 with buckets array when authenticated', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      const res = await agent.get(`${API}/buckets`).expect(200);
      expect(Array.isArray(res.body.buckets)).toBe(true);
      expect(res.body.buckets.length).toBeGreaterThanOrEqual(1);
      const found = res.body.buckets.find((b: { shortId: string }) => b.shortId === bucketShortId);
      expect(found).toBeDefined();
      expect(found.name).toBe('Existing Bucket');
    });

    it('returns buckets sorted by name descending when requested', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      const res = await agent.get(`${API}/buckets?sortBy=name&sortOrder=desc`).expect(200);
      const names = res.body.buckets.map((b: { name: string }) => b.name);
      for (let i = 0; i < names.length - 1; i++) {
        expect(
          names[i].localeCompare(names[i + 1], undefined, { sensitivity: 'base' })
        ).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('GET /buckets/:bucketId/buckets', () => {
    it('orders children by name ascending when sortBy=name&sortOrder=asc', async () => {
      const parentOwnerEmail = `${FILE_PREFIX}-get-children-${Date.now()}@example.com`;
      const hashed = await hashPassword(ownerPassword);
      const owner = await UserService.create({
        email: parentOwnerEmail,
        password: hashed,
        displayName: 'GET Children Owner',
      });
      const mbRoot = await BucketService.createMbRoot({
        ownerId: owner.id,
        name: `Root ${Date.now()}`,
        isPublic: true,
      });
      const agent = await createApiLoginAgent(app, {
        email: parentOwnerEmail,
        password: ownerPassword,
      });
      await agent
        .post(`${API}/buckets/${mbRoot.shortId}/buckets`)
        .send({ type: 'mb-mid', name: 'Zebra Mid' })
        .expect(201);
      await agent
        .post(`${API}/buckets/${mbRoot.shortId}/buckets`)
        .send({ type: 'mb-mid', name: 'Alpha Mid' })
        .expect(201);

      const res = await agent
        .get(`${API}/buckets/${mbRoot.shortId}/buckets?sortBy=name&sortOrder=asc`)
        .expect(200);
      const names = res.body.buckets.map((b: { name: string }) => b.name);
      expect(names).toEqual(['Alpha Mid', 'Zebra Mid']);
    });
  });

  describe('POST /buckets', () => {
    it('returns 401 when unauthenticated', async () => {
      await request(app).post(`${API}/buckets`).send({ name: 'New' }).expect(401);
    });

    it('returns 400 when name is missing', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      await agent.post(`${API}/buckets`).send({ type: 'rss-network' }).expect(400);
    });

    it('creates top-level rss-network bucket', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      const res = await agent
        .post(`${API}/buckets`)
        .send({ type: 'rss-network', name: `${FILE_PREFIX}-new-${Date.now()}` })
        .expect(201);
      expect(res.body.bucket).toBeDefined();
      expect(res.body.bucket).toHaveProperty('id');
      expect(res.body.bucket).toHaveProperty('shortId');
      expect(res.body.bucket).toHaveProperty('name');
      expect(res.body.bucket).toHaveProperty('ownerId');
      expect(res.body.bucket.type).toBe('rss-network');
      expect(res.body.bucket.rss).toBeNull();
      expect(res.body.bucket.messageBodyMaxLength).toBe(500);
    });

    it('creates top-level mb-root bucket', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      const res = await agent
        .post(`${API}/buckets`)
        .send({ type: 'mb-root', name: `${FILE_PREFIX}-mb-root-${Date.now()}` })
        .expect(201);
      expect(res.body.bucket).toBeDefined();
      expect(res.body.bucket.type).toBe('mb-root');
      expect(res.body.bucket.parentBucketId).toBeNull();
      expect(res.body.bucket.rss).toBeNull();
      expect(res.body.bucket.messageBodyMaxLength).toBe(500);
    });

    it('creates top-level rss-channel bucket from rss_feed_url', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      mockFeedFetchOnce(SAMPLE_RSS_XML);
      const res = await agent
        .post(`${API}/buckets`)
        .send({
          type: 'rss-channel',
          rssFeedUrl: `https://example.com/feed-${Date.now()}.xml`,
        })
        .expect(201);

      expect(res.body.bucket.type).toBe('rss-channel');
      expect(res.body.bucket.name).toBe('Sample RSS Channel');
      expect(res.body.bucket.rss).toBeDefined();
      expect(res.body.bucket.rss.rssPodcastGuid).toBe(`feed-guid-${FILE_PREFIX}`);
      expect(res.body.bucket.rss.rssFeedUrl).toContain('https://example.com/feed-');
      expect(res.body.bucket.messageBodyMaxLength).toBe(500);
    });

    it('creates top-level rss-channel bucket from entity-heavy rss feed', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      const podcastGuid = `entity-heavy-guid-${Date.now()}`;
      mockFeedFetchOnce(buildEntityHeavyRssXml(podcastGuid));
      const res = await agent
        .post(`${API}/buckets`)
        .send({
          type: 'rss-channel',
          rssFeedUrl: `https://example.com/entity-heavy-feed-${Date.now()}.xml`,
        })
        .expect(201);

      expect(res.body.bucket.type).toBe('rss-channel');
      expect(res.body.bucket.name).toBe('Entity Heavy RSS Channel');
      expect(res.body.bucket.rss).toBeDefined();
      expect(res.body.bucket.rss.rssPodcastGuid).toBe(podcastGuid);
    });

    it('returns 400 with clear rss field error when required RSS fields are missing', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      mockFeedFetchOnce(
        `<?xml version="1.0"?><rss><channel><title>Missing Guid</title></channel></rss>`
      );
      const res = await agent
        .post(`${API}/buckets`)
        .send({
          type: 'rss-channel',
          rssFeedUrl: `https://example.com/missing-guid-${Date.now()}.xml`,
        })
        .expect(400);

      expect(res.body.message).toBe('RSS feed missing podcast guid.');
      expect(Array.isArray(res.body.details)).toBe(true);
      expect(res.body.details[0]?.path).toBe('rssFeedUrl');
      expect(res.body.details[0]?.message).toBe('RSS feed missing podcast guid.');
    });

    it('returns parser-provided message when rss xml is malformed', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      mockFeedFetchOnce('<rss><channel><title>Broken</title></channel>');
      const res = await agent
        .post(`${API}/buckets`)
        .send({
          type: 'rss-channel',
          rssFeedUrl: `https://example.com/malformed-xml-${Date.now()}.xml`,
        })
        .expect(400);

      expect(res.body.message).toBe('Invalid XML payload.');
      expect(Array.isArray(res.body.details)).toBe(true);
      expect(res.body.details[0]?.path).toBe('rssFeedUrl');
      expect(res.body.details[0]?.message).toBe('Invalid XML payload.');
    });
  });

  describe('POST /buckets/:bucketId/buckets', () => {
    it('creates rss-channel child under rss-network parent', async () => {
      const parentOwnerEmail = `${FILE_PREFIX}-parent-owner-${Date.now()}@example.com`;
      const hashed = await hashPassword(ownerPassword);
      const owner = await UserService.create({
        email: parentOwnerEmail,
        password: hashed,
        displayName: 'Parent Owner',
      });
      const parentRssNetwork = await BucketService.createRssNetwork({
        ownerId: owner.id,
        name: 'Parent RSS Network',
        isPublic: true,
      });
      const agent = await createApiLoginAgent(app, {
        email: parentOwnerEmail,
        password: ownerPassword,
      });
      mockFeedFetchOnce(
        SAMPLE_RSS_XML.replace(`feed-guid-${FILE_PREFIX}`, `feed-guid-child-${Date.now()}`)
      );
      const res = await agent
        .post(`${API}/buckets/${parentRssNetwork.shortId}/buckets`)
        .send({
          type: 'rss-channel',
          rssFeedUrl: `https://example.com/child-feed-${Date.now()}.xml`,
        })
        .expect(201);
      expect(res.body.bucket.type).toBe('rss-channel');
      expect(res.body.bucket.parentBucketId).toBe(parentRssNetwork.id);
    });

    it('creates mb-mid under mb-root and mb-leaf under mb-mid', async () => {
      const parentOwnerEmail = `${FILE_PREFIX}-mb-owner-${Date.now()}@example.com`;
      const hashed = await hashPassword(ownerPassword);
      const owner = await UserService.create({
        email: parentOwnerEmail,
        password: hashed,
        displayName: 'MB Parent Owner',
      });
      const mbRoot = await BucketService.createMbRoot({
        ownerId: owner.id,
        name: `MB Root ${Date.now()}`,
        isPublic: true,
      });
      const agent = await createApiLoginAgent(app, {
        email: parentOwnerEmail,
        password: ownerPassword,
      });

      const midRes = await agent
        .post(`${API}/buckets/${mbRoot.shortId}/buckets`)
        .send({ type: 'mb-mid', name: `MB Mid ${Date.now()}` })
        .expect(201);
      expect(midRes.body.bucket.type).toBe('mb-mid');
      expect(midRes.body.bucket.parentBucketId).toBe(mbRoot.id);

      const midShortId = getRequiredStringField(midRes.body.bucket, 'shortId');
      const midId = getRequiredStringField(midRes.body.bucket, 'id');
      const leafRes = await agent
        .post(`${API}/buckets/${midShortId}/buckets`)
        .send({ type: 'mb-leaf', name: `MB Leaf ${Date.now()}` })
        .expect(201);
      expect(leafRes.body.bucket.type).toBe('mb-leaf');
      expect(leafRes.body.bucket.parentBucketId).toBe(midId);
    });

    it('rejects mb-mid under rss-network parent', async () => {
      const parentOwnerEmail = `${FILE_PREFIX}-mb-mid-rss-parent-${Date.now()}@example.com`;
      const hashed = await hashPassword(ownerPassword);
      const owner = await UserService.create({
        email: parentOwnerEmail,
        password: hashed,
        displayName: 'MB Mid RSS Parent Owner',
      });
      const rssParent = await BucketService.createRssNetwork({
        ownerId: owner.id,
        name: `RSS Parent ${Date.now()}`,
        isPublic: true,
      });
      const agent = await createApiLoginAgent(app, {
        email: parentOwnerEmail,
        password: ownerPassword,
      });
      await agent
        .post(`${API}/buckets/${rssParent.shortId}/buckets`)
        .send({ type: 'mb-mid', name: `Invalid Mid ${Date.now()}` })
        .expect(400, { message: 'Invalid child bucket type for parent bucket.' });
    });

    it('rejects mb-leaf under rss-network parent', async () => {
      const parentOwnerEmail = `${FILE_PREFIX}-mb-leaf-rss-parent-${Date.now()}@example.com`;
      const hashed = await hashPassword(ownerPassword);
      const owner = await UserService.create({
        email: parentOwnerEmail,
        password: hashed,
        displayName: 'MB Leaf RSS Parent Owner',
      });
      const rssParent = await BucketService.createRssNetwork({
        ownerId: owner.id,
        name: `RSS Parent ${Date.now()}`,
        isPublic: true,
      });
      const agent = await createApiLoginAgent(app, {
        email: parentOwnerEmail,
        password: ownerPassword,
      });
      await agent
        .post(`${API}/buckets/${rssParent.shortId}/buckets`)
        .send({ type: 'mb-leaf', name: `Invalid Leaf ${Date.now()}` })
        .expect(400, { message: 'Invalid child bucket type for parent bucket.' });
    });

    it('rejects rss-channel under mb-root parent', async () => {
      const parentOwnerEmail = `${FILE_PREFIX}-rss-under-mb-parent-${Date.now()}@example.com`;
      const hashed = await hashPassword(ownerPassword);
      const owner = await UserService.create({
        email: parentOwnerEmail,
        password: hashed,
        displayName: 'RSS Under MB Parent Owner',
      });
      const mbRoot = await BucketService.createMbRoot({
        ownerId: owner.id,
        name: `MB Root ${Date.now()}`,
        isPublic: true,
      });
      const agent = await createApiLoginAgent(app, {
        email: parentOwnerEmail,
        password: ownerPassword,
      });
      await agent
        .post(`${API}/buckets/${mbRoot.shortId}/buckets`)
        .send({
          type: 'rss-channel',
          rssFeedUrl: `https://example.com/rss-under-mb-${Date.now()}.xml`,
        })
        .expect(400, { message: 'Invalid child bucket type for parent bucket.' });
    });

    it('rejects mb-leaf under mb-root parent', async () => {
      const parentOwnerEmail = `${FILE_PREFIX}-leaf-under-root-${Date.now()}@example.com`;
      const hashed = await hashPassword(ownerPassword);
      const owner = await UserService.create({
        email: parentOwnerEmail,
        password: hashed,
        displayName: 'Leaf Under Root Owner',
      });
      const mbRoot = await BucketService.createMbRoot({
        ownerId: owner.id,
        name: `MB Root ${Date.now()}`,
        isPublic: true,
      });
      const agent = await createApiLoginAgent(app, {
        email: parentOwnerEmail,
        password: ownerPassword,
      });
      await agent
        .post(`${API}/buckets/${mbRoot.shortId}/buckets`)
        .send({ type: 'mb-leaf', name: `Invalid Leaf ${Date.now()}` })
        .expect(400, { message: 'Invalid child bucket type for parent bucket.' });
    });

    it('rejects mb-mid under mb-mid parent', async () => {
      const parentOwnerEmail = `${FILE_PREFIX}-mid-under-mid-${Date.now()}@example.com`;
      const hashed = await hashPassword(ownerPassword);
      const owner = await UserService.create({
        email: parentOwnerEmail,
        password: hashed,
        displayName: 'Mid Under Mid Owner',
      });
      const mbRoot = await BucketService.createMbRoot({
        ownerId: owner.id,
        name: `MB Root ${Date.now()}`,
        isPublic: true,
      });
      const mbMid = await BucketService.createMbMid({
        ownerId: owner.id,
        parentBucketId: mbRoot.id,
        name: `MB Mid ${Date.now()}`,
        isPublic: true,
      });
      const agent = await createApiLoginAgent(app, {
        email: parentOwnerEmail,
        password: ownerPassword,
      });
      await agent
        .post(`${API}/buckets/${mbMid.shortId}/buckets`)
        .send({ type: 'mb-mid', name: `Invalid Mid ${Date.now()}` })
        .expect(400, { message: 'Invalid child bucket type for parent bucket.' });
    });

    it('rejects rss-network-under-rss-network (invalid child type)', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      await agent
        .post(`${API}/buckets/${bucketShortId}/buckets`)
        .send({ type: 'rss-network', name: 'Invalid Child RSS Network' })
        .expect(400);
    });

    it('rejects child create under rss-channel parent', async () => {
      const hashed = await hashPassword(ownerPassword);
      const rssOwnerEmail = `${FILE_PREFIX}-rss-parent-owner-${Date.now()}@example.com`;
      await UserService.create({
        email: rssOwnerEmail,
        password: hashed,
        displayName: 'RSS Parent Owner',
      });
      mockFeedFetchOnce(
        SAMPLE_RSS_XML.replace(`feed-guid-${FILE_PREFIX}`, `feed-guid-parent-${Date.now()}`)
      );
      const rssOwnerAgent = await createApiLoginAgent(app, {
        email: rssOwnerEmail,
        password: ownerPassword,
      });
      const created = await rssOwnerAgent
        .post(`${API}/buckets`)
        .send({
          type: 'rss-channel',
          rssFeedUrl: `https://example.com/rss-parent-${Date.now()}.xml`,
        })
        .expect(201);
      const rssParentShortId = getRequiredStringField(created.body.bucket, 'shortId');
      mockFeedFetchOnce(
        SAMPLE_RSS_XML.replace(`feed-guid-${FILE_PREFIX}`, `feed-guid-disallowed-${Date.now()}`)
      );
      await rssOwnerAgent
        .post(`${API}/buckets/${rssParentShortId}/buckets`)
        .send({
          type: 'rss-channel',
          rssFeedUrl: `https://example.com/disallowed-${Date.now()}.xml`,
        })
        .expect(400, { message: 'Invalid child bucket type for parent bucket.' });
    });

    it('rejects child create under rss-item parent', async () => {
      const hashed = await hashPassword(ownerPassword);
      const itemOwnerEmail = `${FILE_PREFIX}-item-parent-owner-${Date.now()}@example.com`;
      const itemOwner = await UserService.create({
        email: itemOwnerEmail,
        password: hashed,
        displayName: 'Item Parent Owner',
      });
      const rssChannelParent = await BucketService.createRssChannel({
        ownerId: itemOwner.id,
        name: `RSS Channel Parent ${Date.now()}`,
        isPublic: true,
      });
      const rssItemParent = await BucketService.create({
        ownerId: itemOwner.id,
        name: `RSS Item Parent ${Date.now()}`,
        type: 'rss-item',
        isPublic: true,
        parentBucketId: rssChannelParent.id,
      });
      const itemOwnerAgent = await createApiLoginAgent(app, {
        email: itemOwnerEmail,
        password: ownerPassword,
      });
      mockFeedFetchOnce(
        SAMPLE_RSS_XML.replace(
          `feed-guid-${FILE_PREFIX}`,
          `feed-guid-disallowed-item-${Date.now()}`
        )
      );
      await itemOwnerAgent
        .post(`${API}/buckets/${rssItemParent.shortId}/buckets`)
        .send({
          type: 'rss-channel',
          rssFeedUrl: `https://example.com/disallowed-item-${Date.now()}.xml`,
        })
        .expect(400, { message: 'Invalid child bucket type for parent bucket.' });
    });

    it('requires name for mb-mid child payload', async () => {
      const parentOwnerEmail = `${FILE_PREFIX}-mb-mid-name-required-${Date.now()}@example.com`;
      const hashed = await hashPassword(ownerPassword);
      const owner = await UserService.create({
        email: parentOwnerEmail,
        password: hashed,
        displayName: 'MB Mid Name Required Owner',
      });
      const mbRoot = await BucketService.createMbRoot({
        ownerId: owner.id,
        name: `MB Root ${Date.now()}`,
        isPublic: true,
      });
      const agent = await createApiLoginAgent(app, {
        email: parentOwnerEmail,
        password: ownerPassword,
      });
      const res = await agent
        .post(`${API}/buckets/${mbRoot.shortId}/buckets`)
        .send({ type: 'mb-mid' })
        .expect(400);
      expect(res.body.message).toBe('Validation failed');
      expect(Array.isArray(res.body.details)).toBe(true);
      expect(res.body.details[0]?.path).toBe('name');
      expect(res.body.details[0]?.message).toContain('"name" is required');
    });

    it('requires name for mb-leaf child payload', async () => {
      const parentOwnerEmail = `${FILE_PREFIX}-mb-leaf-name-required-${Date.now()}@example.com`;
      const hashed = await hashPassword(ownerPassword);
      const owner = await UserService.create({
        email: parentOwnerEmail,
        password: hashed,
        displayName: 'MB Leaf Name Required Owner',
      });
      const mbRoot = await BucketService.createMbRoot({
        ownerId: owner.id,
        name: `MB Root ${Date.now()}`,
        isPublic: true,
      });
      const mbMid = await BucketService.createMbMid({
        ownerId: owner.id,
        parentBucketId: mbRoot.id,
        name: `MB Mid ${Date.now()}`,
        isPublic: true,
      });
      const agent = await createApiLoginAgent(app, {
        email: parentOwnerEmail,
        password: ownerPassword,
      });
      const res = await agent
        .post(`${API}/buckets/${mbMid.shortId}/buckets`)
        .send({ type: 'mb-leaf' })
        .expect(400);
      expect(res.body.message).toBe('Validation failed');
      expect(Array.isArray(res.body.details)).toBe(true);
      expect(res.body.details[0]?.path).toBe('name');
      expect(res.body.details[0]?.message).toContain('"name" is required');
    });

    it('does not allow rssFeedUrl fallback for mb-mid child payload', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      const parentOwnerEmail = `${FILE_PREFIX}-mb-mid-no-rss-fallback-${Date.now()}@example.com`;
      const hashed = await hashPassword(ownerPassword);
      const owner = await UserService.create({
        email: parentOwnerEmail,
        password: hashed,
        displayName: 'MB Mid No RSS Fallback Owner',
      });
      const mbRoot = await BucketService.createMbRoot({
        ownerId: owner.id,
        name: `MB Root ${Date.now()}`,
        isPublic: true,
      });
      const agent = await createApiLoginAgent(app, {
        email: parentOwnerEmail,
        password: ownerPassword,
      });
      const res = await agent
        .post(`${API}/buckets/${mbRoot.shortId}/buckets`)
        .send({
          type: 'mb-mid',
          rssFeedUrl: `https://example.com/should-not-parse-${Date.now()}.xml`,
        })
        .expect(400);
      expect(res.body.message).toBe('Validation failed');
      expect(Array.isArray(res.body.details)).toBe(true);
      expect(res.body.details[0]?.path).toBe('rssFeedUrl');
      expect(res.body.details[0]?.message).toContain('"rssFeedUrl" is not allowed');
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe('POST /buckets/:bucketId/rss/verify', () => {
    it('verifies rss-channel and syncs rss-item create/orphan/restore lifecycle', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      const podcastGuid = `verify-guid-${Date.now()}`;
      mockFeedFetchOnce(
        buildRssXml({
          podcastGuid,
          items: [
            {
              title: 'Bootstrap Episode',
              guid: 'bootstrap-guid',
              pubDate: 'Mon, 11 Apr 2026 10:00:00 GMT',
            },
          ],
        })
      );
      const created = await agent
        .post(`${API}/buckets`)
        .send({
          type: 'rss-channel',
          rssFeedUrl: `https://example.com/verify-feed-${Date.now()}.xml`,
        })
        .expect(201);
      const bucketShortId = getRequiredStringField(created.body.bucket, 'shortId');
      const bucketId = getRequiredStringField(created.body.bucket, 'id');
      const expectedMetaBoostPath = `${API}/standard/mbrss-v1/boost/${bucketShortId}`;

      mockFeedFetchOnce(
        buildRssXml({
          podcastGuid,
          metaBoostUrl: `${TEST_META_BOOST_ORIGIN}${expectedMetaBoostPath}`,
          items: [
            { title: 'Episode One', guid: 'guid-1', pubDate: 'Mon, 11 Apr 2026 10:00:00 GMT' },
            { title: 'Episode Two', guid: 'guid-2', pubDate: 'Tue, 12 Apr 2026 10:00:00 GMT' },
          ],
        })
      );
      const verifiedFirst = await agent
        .post(`${API}/buckets/${bucketShortId}/rss/verify`)
        .expect(200);
      expect(verifiedFirst.body.verified).toBe(true);
      expect(verifiedFirst.body.sync.createdItemBuckets).toBe(2);
      expect(verifiedFirst.body.sync.orphanedItemBuckets).toBe(0);

      mockFeedFetchOnce(
        buildRssXml({
          podcastGuid,
          metaBoostUrl: `${TEST_META_BOOST_ORIGIN}${expectedMetaBoostPath}`,
          items: [
            {
              title: 'Episode One Updated',
              guid: 'guid-1',
              pubDate: 'Wed, 13 Apr 2026 10:00:00 GMT',
            },
          ],
        })
      );
      const verifiedSecond = await agent
        .post(`${API}/buckets/${bucketShortId}/rss/verify`)
        .expect(200);
      expect(verifiedSecond.body.sync.orphanedItemBuckets).toBe(1);

      let itemInfos = await BucketRSSItemInfoService.listByParentChannelBucketId(bucketId);
      const orphanedInfo = itemInfos.find((item) => item.rssItemGuid === 'guid-2');
      expect(orphanedInfo).toBeDefined();
      expect(orphanedInfo?.orphaned).toBe(true);

      mockFeedFetchOnce(
        buildRssXml({
          podcastGuid,
          metaBoostUrl: `${TEST_META_BOOST_ORIGIN}${expectedMetaBoostPath}`,
          items: [
            {
              title: 'Episode One Updated',
              guid: 'guid-1',
              pubDate: 'Wed, 13 Apr 2026 10:00:00 GMT',
            },
            {
              title: 'Episode Two Returned',
              guid: 'guid-2',
              pubDate: 'Thu, 14 Apr 2026 10:00:00 GMT',
            },
          ],
        })
      );
      const verifiedThird = await agent
        .post(`${API}/buckets/${bucketShortId}/rss/verify`)
        .expect(200);
      expect(verifiedThird.body.sync.restoredItemBuckets).toBe(1);

      itemInfos = await BucketRSSItemInfoService.listByParentChannelBucketId(bucketId);
      const restoredInfo = itemInfos.find((item) => item.rssItemGuid === 'guid-2');
      expect(restoredInfo?.orphaned).toBe(false);
    });

    it('returns clear failure when metaBoost tag is missing', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      const podcastGuid = `missing-tag-guid-${Date.now()}`;
      mockFeedFetchOnce(
        buildRssXml({
          podcastGuid,
          items: [
            {
              title: 'Bootstrap Episode',
              guid: 'bootstrap-guid',
              pubDate: 'Mon, 11 Apr 2026 10:00:00 GMT',
            },
          ],
        })
      );
      const created = await agent
        .post(`${API}/buckets`)
        .send({
          type: 'rss-channel',
          rssFeedUrl: `https://example.com/missing-tag-feed-${Date.now()}.xml`,
        })
        .expect(201);
      const bucketShortId = getRequiredStringField(created.body.bucket, 'shortId');

      mockFeedFetchOnce(
        buildRssXml({
          podcastGuid,
          items: [
            { title: 'Episode One', guid: 'guid-1', pubDate: 'Mon, 11 Apr 2026 10:00:00 GMT' },
          ],
        })
      );
      const res = await agent.post(`${API}/buckets/${bucketShortId}/rss/verify`).expect(400);
      expect(res.body.details.reason).toBe('missing_meta_boost_tag');
    });

    it('returns clear failure when metaBoost URL path mismatches expected bucket', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      const podcastGuid = `mismatch-guid-${Date.now()}`;
      mockFeedFetchOnce(
        buildRssXml({
          podcastGuid,
          items: [
            {
              title: 'Bootstrap Episode',
              guid: 'bootstrap-guid',
              pubDate: 'Mon, 11 Apr 2026 10:00:00 GMT',
            },
          ],
        })
      );
      const created = await agent
        .post(`${API}/buckets`)
        .send({
          type: 'rss-channel',
          rssFeedUrl: `https://example.com/mismatch-feed-${Date.now()}.xml`,
        })
        .expect(201);
      const bucketShortId = getRequiredStringField(created.body.bucket, 'shortId');

      mockFeedFetchOnce(
        buildRssXml({
          podcastGuid,
          metaBoostUrl: `${TEST_META_BOOST_ORIGIN}${API}/standard/mbrss-v1/boost/some-other-bucket`,
          items: [
            { title: 'Episode One', guid: 'guid-1', pubDate: 'Mon, 11 Apr 2026 10:00:00 GMT' },
          ],
        })
      );
      const res = await agent.post(`${API}/buckets/${bucketShortId}/rss/verify`).expect(400);
      expect(res.body.details.reason).toBe('meta_boost_url_mismatch');
    });
  });

  describe('GET /buckets/:id', () => {
    it('returns 401 when unauthenticated', async () => {
      await request(app).get(`${API}/buckets/${bucketShortId}`).expect(401);
    });

    it('returns 404 when bucket does not exist', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      await agent
        .get(`${API}/buckets/nonexistent-short-id`)
        .expect(404, { message: 'Bucket not found' });
    });

    it('returns 200 with bucket when authenticated and bucket exists', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      const res = await agent.get(`${API}/buckets/${bucketShortId}`).expect(200);
      expect(res.body.bucket).toBeDefined();
      expect(res.body.bucket.shortId).toBe(bucketShortId);
      expect(res.body.bucket.name).toBe('Existing Bucket');
    });
  });

  describe('PATCH /buckets/:id', () => {
    it('returns 401 when unauthenticated', async () => {
      await request(app)
        .patch(`${API}/buckets/${bucketShortId}`)
        .send({ name: 'Updated' })
        .expect(401);
    });

    it('returns 404 when bucket does not exist', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      await agent
        .patch(`${API}/buckets/nonexistent-short-id`)
        .send({ name: 'Updated' })
        .expect(404, { message: 'Bucket not found' });
    });

    it('returns 200 with updated bucket when body valid', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      const newName = `${FILE_PREFIX}-patched-${Date.now()}`;
      const res = await agent
        .patch(`${API}/buckets/${bucketShortId}`)
        .send({ name: newName })
        .expect(200);
      expect(res.body.bucket).toBeDefined();
      expect(res.body.bucket.name).toBe(newName);
      // Restore for other tests that expect original name
      await agent
        .patch(`${API}/buckets/${bucketShortId}`)
        .send({ name: 'Existing Bucket' })
        .expect(200);
    });

    it('validates messageBodyMaxLength range and disallows null', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      await agent
        .patch(`${API}/buckets/${bucketShortId}`)
        .send({ messageBodyMaxLength: null })
        .expect(400);
      await agent
        .patch(`${API}/buckets/${bucketShortId}`)
        .send({ messageBodyMaxLength: 139 })
        .expect(400);
      await agent
        .patch(`${API}/buckets/${bucketShortId}`)
        .send({ messageBodyMaxLength: 2501 })
        .expect(400);

      await agent
        .patch(`${API}/buckets/${bucketShortId}`)
        .send({ messageBodyMaxLength: 140 })
        .expect(200);
      await agent
        .patch(`${API}/buckets/${bucketShortId}`)
        .send({ messageBodyMaxLength: 2500 })
        .expect(200);
    });

    it('inherits immediate-parent public and settings on child create', async () => {
      const ownerBucket = await BucketService.findByShortId(bucketShortId);
      expect(ownerBucket).not.toBeNull();
      if (ownerBucket === null) {
        throw new Error('Expected test bucket to exist');
      }
      const root = await BucketService.create({
        ownerId: ownerBucket.ownerId,
        name: `inherit-root-${Date.now()}`,
        isPublic: true,
      });
      await BucketService.update(root.id, { isPublic: false, messageBodyMaxLength: 321 });
      const child = await BucketService.create({
        ownerId: root.ownerId,
        name: `inherit-child-${Date.now()}`,
        parentBucketId: root.id,
      });
      const savedChild = await BucketService.findById(child.id);
      expect(savedChild).not.toBeNull();
      expect(savedChild?.isPublic).toBe(false);
      expect(savedChild?.settings?.messageBodyMaxLength).toBe(321);
    });

    it('applies recursive settings cascade when applyToDescendants is true', async () => {
      const ownerBucket = await BucketService.findByShortId(bucketShortId);
      expect(ownerBucket).not.toBeNull();
      if (ownerBucket === null) {
        throw new Error('Expected test bucket to exist');
      }
      const root = await BucketService.create({
        ownerId: ownerBucket.ownerId,
        name: `cascade-root-${Date.now()}`,
        isPublic: true,
      });
      const child = await BucketService.create({
        ownerId: ownerBucket.ownerId,
        name: `cascade-child-${Date.now()}`,
        parentBucketId: root.id,
      });
      const grandchild = await BucketService.create({
        ownerId: ownerBucket.ownerId,
        name: `cascade-grandchild-${Date.now()}`,
        parentBucketId: child.id,
      });

      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      await agent
        .patch(`${API}/buckets/${root.shortId}`)
        .send({ isPublic: false, messageBodyMaxLength: 222, applyToDescendants: true })
        .expect(200);

      const updatedChild = await BucketService.findById(child.id);
      const updatedGrandchild = await BucketService.findById(grandchild.id);
      expect(updatedChild?.isPublic).toBe(false);
      expect(updatedGrandchild?.isPublic).toBe(false);
      expect(updatedChild?.settings?.messageBodyMaxLength).toBe(222);
      expect(updatedGrandchild?.settings?.messageBodyMaxLength).toBe(222);
    });

    it('rejects making descendant public when an ancestor is private', async () => {
      const ownerBucket = await BucketService.findByShortId(bucketShortId);
      expect(ownerBucket).not.toBeNull();
      if (ownerBucket === null) {
        throw new Error('Expected test bucket to exist');
      }
      const root = await BucketService.create({
        ownerId: ownerBucket.ownerId,
        name: `visibility-root-${Date.now()}`,
        isPublic: false,
      });
      const child = await BucketService.create({
        ownerId: ownerBucket.ownerId,
        name: `visibility-child-${Date.now()}`,
        parentBucketId: root.id,
      });

      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      await agent.patch(`${API}/buckets/${child.shortId}`).send({ isPublic: true }).expect(400, {
        message: 'A descendant bucket can only be public when all ancestor buckets are public.',
      });
      await agent.patch(`${API}/buckets/${child.shortId}`).send({ isPublic: false }).expect(200);
    });

    it('blocks manual rename for rss-channel buckets', async () => {
      const ownerBucket = await BucketService.findByShortId(bucketShortId);
      expect(ownerBucket).not.toBeNull();
      if (ownerBucket === null) {
        throw new Error('Expected test bucket to exist');
      }
      const rssChannel = await BucketService.createRssChannel({
        ownerId: ownerBucket.ownerId,
        name: `rss-channel-${Date.now()}`,
        isPublic: true,
      });
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      await agent
        .patch(`${API}/buckets/${rssChannel.shortId}`)
        .send({ name: 'manual-rename-attempt' })
        .expect(400, {
          message:
            'Name is derived for RSS channel and item buckets and cannot be edited manually.',
        });
    });
  });

  describe('DELETE /buckets/:id', () => {
    it('returns 401 when unauthenticated', async () => {
      await request(app).delete(`${API}/buckets/${bucketShortId}`).expect(401);
    });

    it('returns 404 when bucket does not exist', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      await agent
        .delete(`${API}/buckets/nonexistent-short-id`)
        .expect(404, { message: 'Bucket not found' });
    });

    it('returns 204 when authenticated and bucket exists', async () => {
      const delOwnerEmail = `${FILE_PREFIX}-del-${Date.now()}@example.com`;
      const hashed = await hashPassword(ownerPassword);
      const owner = await UserService.create({
        email: delOwnerEmail,
        password: hashed,
        displayName: 'Del Owner',
      });
      const bucket = await BucketService.create({
        ownerId: owner.id,
        name: 'To Delete',
      });
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      const delAgent = await createApiLoginAgent(app, {
        email: delOwnerEmail,
        password: ownerPassword,
      });
      await delAgent.delete(`${API}/buckets/${bucket.shortId}`).expect(204);
      await agent.get(`${API}/buckets/${bucket.shortId}`).expect(404);
    });
  });

  describe('removed message write routes', () => {
    it('POST /buckets/public/:id/messages returns 404 (route removed)', async () => {
      await request(app)
        .post(`${API}/buckets/public/${bucketShortId}/messages`)
        .send({ senderName: 'Removed Route', body: 'Should not be accepted' })
        .expect(404);
    });

    it('POST /buckets/:bucketId/messages returns 404 (route removed)', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      await agent
        .post(`${API}/buckets/${bucketShortId}/messages`)
        .send({ senderName: 'Removed Route', body: 'Should not be accepted' })
        .expect(404);
    });

    it('PATCH /buckets/:bucketId/messages/:id returns 404 (route removed)', async () => {
      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      await agent
        .patch(`${API}/buckets/${bucketShortId}/messages/00000000-0000-4000-a000-000000000000`)
        .send({ body: 'Should not be accepted' })
        .expect(404);
    });
  });

  describe('removed legacy public message read route', () => {
    it('GET /buckets/public/:id/messages returns 404 (route removed)', async () => {
      await request(app).get(`${API}/buckets/public/${bucketShortId}/messages`).expect(404);
    });
  });

  describe('message retrieval excludes stream action rows', () => {
    it('GET /buckets/:bucketId/messages returns only boost messages', async () => {
      const ownerBucket = await BucketService.findByShortId(bucketShortId);
      expect(ownerBucket).not.toBeNull();
      if (ownerBucket === null) {
        throw new Error('Expected test bucket to exist');
      }
      const channelBucket = await BucketService.createRssChannel({
        ownerId: ownerBucket.ownerId,
        name: `msg-list-channel-${Date.now()}`,
        isPublic: true,
      });
      const targetBucketId = channelBucket.id;
      const channelShortId = channelBucket.shortId;
      const boostBody = `boost-visible-${Date.now()}`;
      await BucketMessageService.create({
        bucketId: targetBucketId,
        senderName: 'Boost Sender',
        body: boostBody,
        currency: 'USD',
        amount: 1,
        action: 'boost',
        appName: 'test-suite',
      });
      const streamMessage = await BucketMessageService.create({
        bucketId: targetBucketId,
        senderName: 'Stream Sender',
        body: null,
        currency: 'USD',
        amount: 1,
        action: 'stream',
        appName: 'test-suite',
      });

      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      const res = await agent.get(`${API}/buckets/${channelShortId}/messages`).expect(200);
      const messages = res.body.messages as Array<{ id: string; body: string; action?: string }>;
      expect(messages.some((m) => m.body === boostBody)).toBe(true);
      expect(messages.some((m) => m.id === streamMessage.id)).toBe(false);
      expect(messages.some((m) => m.action === 'stream')).toBe(false);
    });

    it('GET /buckets/:bucketId/messages/:id returns 404 for stream action message', async () => {
      const ownerBucket = await BucketService.findByShortId(bucketShortId);
      expect(ownerBucket).not.toBeNull();
      const channelBucket = await BucketService.createRssChannel({
        ownerId: ownerBucket!.ownerId,
        name: `msg-by-id-channel-${Date.now()}`,
        isPublic: true,
      });
      const streamMessage = await BucketMessageService.create({
        bucketId: channelBucket.id,
        senderName: 'Stream Sender',
        body: null,
        currency: 'USD',
        amount: 1,
        action: 'stream',
        appName: 'test-suite',
      });

      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });
      await agent
        .get(`${API}/buckets/${channelBucket.shortId}/messages/${streamMessage.id}`)
        .expect(404, {
          message: 'Message not found',
        });
    });

    it('aggregates rss-network messages from descendant channel and item buckets (newest first)', async () => {
      const ownerBucket = await BucketService.findByShortId(bucketShortId);
      expect(ownerBucket).not.toBeNull();
      if (ownerBucket === null) {
        throw new Error('Expected owner bucket to exist');
      }
      const ownerId = ownerBucket.ownerId;

      const network = await BucketService.createRssNetwork({
        ownerId,
        name: `network-${Date.now()}`,
        isPublic: true,
      });
      const channel = await BucketService.createRssChannel({
        ownerId,
        parentBucketId: network.id,
        name: `channel-${Date.now()}`,
        isPublic: true,
      });
      const item = await BucketService.createRssItem({
        ownerId,
        parentBucketId: channel.id,
        name: `item-${Date.now()}`,
        isPublic: true,
      });

      const channelBody = `network-channel-msg-${Date.now()}`;
      const itemBody = `network-item-msg-${Date.now()}`;
      const directNetworkBody = `network-direct-msg-${Date.now()}`;

      await BucketMessageService.create({
        bucketId: channel.id,
        senderName: 'Channel Sender',
        body: channelBody,
        currency: 'USD',
        amount: 1,
        action: 'boost',
        appName: 'test-suite',
      });
      await new Promise((resolve) => setTimeout(resolve, 15));
      await BucketMessageService.create({
        bucketId: item.id,
        senderName: 'Item Sender',
        body: itemBody,
        currency: 'USD',
        amount: 1,
        action: 'boost',
        appName: 'test-suite',
      });
      await new Promise((resolve) => setTimeout(resolve, 15));
      await BucketMessageService.create({
        bucketId: network.id,
        senderName: 'Direct Network Sender',
        body: directNetworkBody,
        currency: 'USD',
        amount: 1,
        action: 'boost',
        appName: 'test-suite',
      });

      const agent = await createApiLoginAgent(app, {
        email: ownerEmail,
        password: ownerPassword,
      });

      const networkRecentRes = await agent
        .get(`${API}/buckets/${network.shortId}/messages`)
        .expect(200);
      const networkRecentMessages = networkRecentRes.body.messages as Array<{
        body: string;
        sourceBucketContext?: {
          bucket: { shortId: string; name: string; type: string };
          parentBucket: { shortId: string; name: string; type: string } | null;
        };
      }>;
      const networkRecentBodies = (networkRecentRes.body.messages as Array<{ body: string }>).map(
        (message) => message.body
      );
      expect(networkRecentBodies).toEqual([itemBody, channelBody]);
      expect(networkRecentBodies).not.toContain(directNetworkBody);
      const itemMessage = networkRecentMessages.find((message) => message.body === itemBody);
      const channelMessage = networkRecentMessages.find((message) => message.body === channelBody);
      expect(itemMessage?.sourceBucketContext?.bucket.shortId).toBe(item.shortId);
      expect(itemMessage?.sourceBucketContext?.bucket.name).toBe(item.name);
      expect(itemMessage?.sourceBucketContext?.bucket.type).toBe('rss-item');
      expect(itemMessage?.sourceBucketContext?.parentBucket?.shortId).toBe(channel.shortId);
      expect(itemMessage?.sourceBucketContext?.parentBucket?.name).toBe(channel.name);
      expect(itemMessage?.sourceBucketContext?.parentBucket?.type).toBe('rss-channel');
      expect(channelMessage?.sourceBucketContext?.bucket.shortId).toBe(channel.shortId);
      expect(channelMessage?.sourceBucketContext?.bucket.name).toBe(channel.name);
      expect(channelMessage?.sourceBucketContext?.bucket.type).toBe('rss-channel');

      const networkOldestRes = await agent
        .get(`${API}/buckets/${network.shortId}/messages?sort=oldest`)
        .expect(200);
      const networkOldestBodies = (networkOldestRes.body.messages as Array<{ body: string }>).map(
        (message) => message.body
      );
      expect(networkOldestBodies).toEqual([channelBody, itemBody]);

      const channelRes = await agent.get(`${API}/buckets/${channel.shortId}/messages`).expect(200);
      const channelMessages = channelRes.body.messages as Array<{
        body: string;
        sourceBucketContext?: {
          bucket: { shortId: string; name: string; type: string };
          parentBucket: { shortId: string; name: string; type: string } | null;
        };
      }>;
      const channelBodies = channelMessages.map((message) => message.body);
      expect(channelBodies).toEqual([itemBody, channelBody]);
      const channelItemMessage = channelMessages.find((message) => message.body === itemBody);
      const channelChannelMessage = channelMessages.find((message) => message.body === channelBody);
      expect(channelItemMessage?.sourceBucketContext?.bucket.shortId).toBe(item.shortId);
      expect(channelItemMessage?.sourceBucketContext?.bucket.name).toBe(item.name);
      expect(channelItemMessage?.sourceBucketContext?.bucket.type).toBe('rss-item');
      expect(channelItemMessage?.sourceBucketContext?.parentBucket?.shortId).toBe(channel.shortId);
      expect(channelItemMessage?.sourceBucketContext?.parentBucket?.name).toBe(channel.name);
      expect(channelItemMessage?.sourceBucketContext?.parentBucket?.type).toBe('rss-channel');
      expect(channelChannelMessage?.sourceBucketContext?.bucket.shortId).toBe(channel.shortId);
      expect(channelChannelMessage?.sourceBucketContext?.bucket.name).toBe(channel.name);
      expect(channelChannelMessage?.sourceBucketContext?.bucket.type).toBe('rss-channel');

      const channelOldestRes = await agent
        .get(`${API}/buckets/${channel.shortId}/messages?sort=oldest`)
        .expect(200);
      const channelOldestBodies = (channelOldestRes.body.messages as Array<{ body: string }>).map(
        (message) => message.body
      );
      expect(channelOldestBodies).toEqual([channelBody, itemBody]);

      const itemRes = await agent.get(`${API}/buckets/${item.shortId}/messages`).expect(200);
      const itemBodies = (itemRes.body.messages as Array<{ body: string }>).map(
        (message) => message.body
      );
      expect(itemBodies).toContain(itemBody);
      expect(itemBodies).not.toContain(channelBody);
    });
  });
});
