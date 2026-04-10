import { CRUD_BITS } from '@metaboost/helpers';

const READ_BIT = CRUD_BITS.read;

/**
 * Enforces minimum permissions for bucket admin roles:
 * - Bucket and message must include read.
 * - Message inherits bucket: any bucket permission is also granted for messages.
 */
export function normalizeBucketMessageCrud(
  bucketCrud: number,
  bucketMessagesCrud: number
): { bucketCrud: number; bucketMessagesCrud: number } {
  const bucket = bucketCrud | READ_BIT;
  const bucketMessages = bucketMessagesCrud | READ_BIT | bucket;
  return { bucketCrud: bucket, bucketMessagesCrud: bucketMessages };
}
