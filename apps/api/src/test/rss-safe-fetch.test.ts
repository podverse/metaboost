import { Buffer } from 'node:buffer';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  assertSafeRssDestination,
  fetchRssFeedText,
  readLimitedResponseBodyAsText,
  RSS_FETCH_MAX_REDIRECTS,
} from '../lib/rss-safe-fetch.js';

describe('RSS safe fetch — destination policy', () => {
  it('rejects literal loopback IPv4', async () => {
    await expect(assertSafeRssDestination(new URL('http://127.0.0.1/feed.xml'))).rejects.toThrow(
      /blocked network address/i
    );
  });

  it('rejects literal private IPv4', async () => {
    await expect(assertSafeRssDestination(new URL('http://10.0.0.1/podcast.xml'))).rejects.toThrow(
      /blocked network address/i
    );
  });

  it('rejects literal metadata-style link-local IPv4', async () => {
    await expect(
      assertSafeRssDestination(new URL('http://169.254.169.254/latest/meta-data'))
    ).rejects.toThrow(/blocked network address/i);
  });

  it('rejects URLs with embedded credentials', async () => {
    await expect(
      assertSafeRssDestination(new URL('http://user:pass@example.com/feed.xml'))
    ).rejects.toThrow(/credentials/i);
  });

  it('allows a public literal IPv4', async () => {
    await expect(assertSafeRssDestination(new URL('http://8.8.8.8/'))).resolves.toBeUndefined();
  });

  it('rejects localhost hostname (typically resolves to loopback)', async () => {
    await expect(assertSafeRssDestination(new URL('http://localhost/feed.xml'))).rejects.toThrow(
      /blocked network address/i
    );
  });
});

describe('RSS safe fetch — response body limit', () => {
  it('throws when the body exceeds the byte limit', async () => {
    const encoder = new TextEncoder();
    const chunk = encoder.encode('x'.repeat(100));
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        for (let i = 0; i < 50; i += 1) {
          controller.enqueue(chunk);
        }
        controller.close();
      },
    });
    const res = new Response(stream);
    await expect(readLimitedResponseBodyAsText(res, 1000)).rejects.toThrow(/too large/i);
  });

  it('returns text when under the byte limit', async () => {
    const body = '<rss><channel><title>t</title></channel></rss>';
    const res = new Response(body);
    await expect(readLimitedResponseBodyAsText(res, 10_000)).resolves.toBe(body);
  });

  it('counts raw bytes not UTF-16 characters', async () => {
    const encoder = new TextEncoder();
    const smile = '🙂';
    const buf = encoder.encode(smile.repeat(400));
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(buf);
        controller.close();
      },
    });
    const res = new Response(stream);
    await expect(readLimitedResponseBodyAsText(res, buf.byteLength - 1)).rejects.toThrow(
      /too large/i
    );
    const resOk = new Response(Buffer.from(buf));
    await expect(readLimitedResponseBodyAsText(resOk, buf.byteLength)).resolves.toHaveLength(
      smile.length * 400
    );
  });
});

describe('RSS safe fetch — redirects', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /** Minimal fetch Response for redirects; must set `url` so `new URL(Location, res.url)` resolves. */
  function redirectResponse(location: string, responseUrl: string): Response {
    const headers = new Headers({ Location: location });
    return {
      status: 302,
      ok: false,
      url: responseUrl,
      headers,
      body: null,
    } as Response;
  }

  it('rejects a redirect target that resolves to a blocked address', async () => {
    const ac = new AbortController();
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          redirectResponse('http://127.0.0.1/private.xml', 'https://1.1.1.1/feed.xml')
        )
    );

    await expect(
      fetchRssFeedText('https://1.1.1.1/feed.xml', {
        signal: ac.signal,
        maxBytes: 10_000,
        userAgent: 'rss-test',
      })
    ).rejects.toThrow(/blocked network address/i);
  });

  it(`fails after more than ${RSS_FETCH_MAX_REDIRECTS} redirects`, async () => {
    const ac = new AbortController();
    let call = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (_input: Parameters<typeof fetch>[0]) => {
        call += 1;
        const prevUrl =
          typeof _input === 'string' ? _input : _input instanceof URL ? _input.href : _input.url;
        return redirectResponse(`https://8.8.8.8/r/${call}`, prevUrl);
      })
    );

    await expect(
      fetchRssFeedText('https://8.8.8.8/start', {
        signal: ac.signal,
        maxBytes: 10_000,
        userAgent: 'rss-test',
      })
    ).rejects.toThrow(/redirect limit/i);

    expect(call).toBeGreaterThan(RSS_FETCH_MAX_REDIRECTS);
  });
});
