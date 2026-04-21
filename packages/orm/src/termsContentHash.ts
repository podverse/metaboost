import { createHash } from 'node:crypto';

/** SHA-256 hex of en-US + "\\n---\\n" + es — must match bootstrap and management-api persistence. */
export function computeTermsContentHash(contentTextEnUs: string, contentTextEs: string): string {
  return createHash('sha256').update(`${contentTextEnUs}\n---\n${contentTextEs}`).digest('hex');
}
