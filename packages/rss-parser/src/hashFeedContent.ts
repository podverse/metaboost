import { createHash } from 'node:crypto';

export function hashFeedContent(xml: string): string {
  return createHash('sha256').update(xml).digest('hex');
}
