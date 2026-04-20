import { createHash } from 'node:crypto';

/**
 * Lowercase hex SHA-256 of the exact raw request body bytes (claim `bh`).
 */
export function hashRequestBody(body: Buffer | Uint8Array): string {
  return createHash('sha256').update(body).digest('hex');
}
