import crypto from 'crypto';

const TOKEN_BYTES = 32;
const HASH_ALGO = 'sha256';

export function generateToken(): string {
  return crypto.randomBytes(TOKEN_BYTES).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash(HASH_ALGO).update(token, 'utf8').digest('hex');
}

/** Expiry for set_password tokens using configured invitation TTL hours. */
export function getSetPasswordExpiry(invitationTtlHours: number): Date {
  const d = new Date();
  d.setTime(d.getTime() + invitationTtlHours * 60 * 60 * 1000);
  return d;
}
