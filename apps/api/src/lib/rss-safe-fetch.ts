/**
 * SSRF-aware RSS feed HTTP fetch: DNS/IP allow policy, manual redirect validation,
 * response size cap, and optional structured logging on block.
 */
import dns from 'node:dns/promises';
import net from 'node:net';

import { MinimalRssParserError } from '@metaboost/rss-parser';

import { config } from '../config/index.js';
import { assertRssOutboundFetchEnabled } from './rss-outbound.js';

export const RSS_FETCH_TIMEOUT_MS = 10000;

/** Maximum HTTP redirects while fetching an RSS feed (each hop re-validates destination). */
export const RSS_FETCH_MAX_REDIRECTS = 5;

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

function logRssOutboundBlocked(reason: string, detail: Record<string, string>): void {
  console.warn(`[rss-fetch] blocked: ${reason}`, detail);
}

/**
 * IPv4/IPv6 ranges that must not be used for user-influenced RSS outbound fetches.
 */
const rssBlockedDestinations = new net.BlockList();
rssBlockedDestinations.addSubnet('0.0.0.0', 8, 'ipv4');
rssBlockedDestinations.addSubnet('10.0.0.0', 8, 'ipv4');
rssBlockedDestinations.addSubnet('127.0.0.0', 8, 'ipv4');
rssBlockedDestinations.addSubnet('169.254.0.0', 16, 'ipv4');
rssBlockedDestinations.addSubnet('172.16.0.0', 12, 'ipv4');
rssBlockedDestinations.addSubnet('192.168.0.0', 16, 'ipv4');
rssBlockedDestinations.addSubnet('100.64.0.0', 10, 'ipv4');
rssBlockedDestinations.addSubnet('224.0.0.0', 4, 'ipv4');

rssBlockedDestinations.addSubnet('::1', 128, 'ipv6');
rssBlockedDestinations.addSubnet('fe80::', 10, 'ipv6');
rssBlockedDestinations.addSubnet('fc00::', 7, 'ipv6');
rssBlockedDestinations.addSubnet('ff00::', 8, 'ipv6');

function isBlockedIp(ip: string): boolean {
  const kind = net.isIP(ip);
  if (kind === 0) {
    return true;
  }
  try {
    return rssBlockedDestinations.check(ip, kind === 4 ? 'ipv4' : 'ipv6');
  } catch {
    return true;
  }
}

function blockError(message: string): MinimalRssParserError {
  return new MinimalRssParserError({
    code: 'invalid_input',
    message,
  });
}

async function resolveHostnameIps(hostname: string): Promise<string[]> {
  const ipv4 = await dns.resolve4(hostname).catch((err: NodeJS.ErrnoException) => {
    if (err.code === 'ENOTFOUND' || err.code === 'ENODATA') return [];
    throw err;
  });
  const ipv6 = await dns.resolve6(hostname).catch((err: NodeJS.ErrnoException) => {
    if (err.code === 'ENOTFOUND' || err.code === 'ENODATA') return [];
    throw err;
  });
  return [...ipv4, ...ipv6];
}

/**
 * Throws if the URL must not be fetched (private metadata, loopback, RFC1918, SSRF sinks).
 */
export async function assertSafeRssDestination(url: URL): Promise<void> {
  if (url.username !== '' || url.password !== '') {
    logRssOutboundBlocked('credentials_in_url', { url: url.href });
    throw blockError('RSS feed URL must not include credentials.');
  }

  const scheme = url.protocol.toLowerCase();
  if (scheme !== 'http:' && scheme !== 'https:') {
    throw blockError('RSS feed URL must use http or https.');
  }

  const hostname = url.hostname;
  if (hostname === '') {
    throw blockError('RSS feed URL is missing a hostname.');
  }

  /**
   * Web E2E only: Playwright serves RSS fixtures at http://localhost:<web>/e2e/rss/... . Production must
   * never set METABOOST_E2E_RSS_ALLOW_LOOPBACK.
   */
  if (process.env.METABOOST_E2E_RSS_ALLOW_LOOPBACK === '1') {
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      return;
    }
  }

  const literalIpKind = net.isIP(hostname);
  if (literalIpKind !== 0) {
    if (isBlockedIp(hostname)) {
      logRssOutboundBlocked('blocked_literal_ip', { hostname });
      throw blockError('RSS feed hostname resolves to a blocked network address.');
    }
    return;
  }

  let ips: string[];
  try {
    ips = await resolveHostnameIps(hostname);
  } catch {
    throw blockError('RSS feed hostname could not be resolved.');
  }

  if (ips.length === 0) {
    throw blockError('RSS feed hostname could not be resolved.');
  }

  for (const ip of ips) {
    if (isBlockedIp(ip)) {
      logRssOutboundBlocked('blocked_resolved_ip', { hostname, ip });
      throw blockError('RSS feed hostname resolves to a blocked network address.');
    }
  }
}

async function drainResponseBody(res: Response): Promise<void> {
  if (res.body !== null) {
    await res.body.cancel();
  }
}

/**
 * Reads UTF-8 text up to maxBytes (inclusive limit on raw byte length read from the wire).
 */
export async function readLimitedResponseBodyAsText(
  response: Response,
  maxBytes: number
): Promise<string> {
  const body = response.body;
  if (body === null) {
    return '';
  }
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value !== undefined) {
        total += value.byteLength;
        if (total > maxBytes) {
          logRssOutboundBlocked('response_too_large', { maxBytes: String(maxBytes) });
          await reader.cancel();
          throw blockError(`RSS feed response is too large (limit ${maxBytes} bytes).`);
        }
        chunks.push(value);
      }
    }
  } finally {
    reader.releaseLock();
  }
  const merged = Buffer.concat(chunks.map((c) => Buffer.from(c)));
  return merged.toString('utf8');
}

export type FetchRssFeedTextOptions = {
  signal: AbortSignal;
  maxBytes: number;
  userAgent: string;
};

/**
 * Fetches RSS/XML over HTTP(S) with redirect: manual, validating each hop and enforcing a body size cap.
 */
export async function fetchRssFeedText(
  initialUrl: string,
  options: FetchRssFeedTextOptions
): Promise<string> {
  assertRssOutboundFetchEnabled();

  let currentUrl = initialUrl;

  for (let redirects = 0; redirects <= RSS_FETCH_MAX_REDIRECTS; redirects += 1) {
    let parsed: URL;
    try {
      parsed = new URL(currentUrl);
    } catch {
      throw blockError('RSS feed URL is not a valid URL.');
    }

    await assertSafeRssDestination(parsed);

    const res = await fetch(currentUrl, {
      method: 'GET',
      signal: options.signal,
      redirect: 'manual',
      headers: {
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
        'User-Agent': options.userAgent,
      },
    });

    if (REDIRECT_STATUSES.has(res.status)) {
      const location = res.headers.get('location');
      await drainResponseBody(res);
      if (location === null || location.trim() === '') {
        throw blockError(`RSS feed redirect (${res.status}) is missing a Location header.`);
      }
      currentUrl = new URL(location, res.url).href;
      continue;
    }

    if (!res.ok) {
      await drainResponseBody(res);
      throw new MinimalRssParserError({
        code: 'invalid_input',
        message: `Feed URL returned HTTP ${res.status}.`,
      });
    }

    return await readLimitedResponseBodyAsText(res, options.maxBytes);
  }

  logRssOutboundBlocked('too_many_redirects', { maxRedirects: String(RSS_FETCH_MAX_REDIRECTS) });
  throw blockError(`RSS feed fetch exceeded redirect limit (${RSS_FETCH_MAX_REDIRECTS}).`);
}

/**
 * High-level helper used by RSS sync and bucket creation: timeout + config-driven body limit + User-Agent.
 */
export async function fetchRssFeedXmlWithTimeout(
  rssFeedUrl: string,
  timeoutMs = RSS_FETCH_TIMEOUT_MS
): Promise<string> {
  const abortController = new AbortController();
  const timer = setTimeout(() => abortController.abort(), timeoutMs);
  try {
    return await fetchRssFeedText(rssFeedUrl, {
      signal: abortController.signal,
      maxBytes: config.rssFeedMaxBodyBytes,
      userAgent: config.userAgent,
    });
  } catch (error) {
    if (error instanceof MinimalRssParserError) {
      throw error;
    }
    throw new MinimalRssParserError({
      code: 'invalid_input',
      message: 'Failed to fetch RSS feed URL.',
      details: error,
    });
  } finally {
    clearTimeout(timer);
  }
}
