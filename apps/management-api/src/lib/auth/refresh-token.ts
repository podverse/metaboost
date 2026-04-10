import crypto from 'crypto';

const TOKEN_BYTES = 32;
const HASH_ALGO = 'sha256';

export function generateToken(): string {
  return crypto.randomBytes(TOKEN_BYTES).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash(HASH_ALGO).update(token, 'utf8').digest('hex');
}
